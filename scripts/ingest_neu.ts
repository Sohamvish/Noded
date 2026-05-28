/**
 * NEU (Not Enough Updates) data ingestion script.
 *
 * Reads item JSON files from a locally cloned NEU repository,
 * transforms them into our Supabase schema, and batch-upserts.
 *
 * Required env vars:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env vars:
 *   NEU_REPO_PATH  (default: ./neu-data)
 *
 * Locally, values are loaded from .env.local via dotenv.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { Database, RecipeType } from "../src/types/database";

type ItemInsert = Database["public"]["Tables"]["items"]["Insert"];
type RecipeInsert = Database["public"]["Tables"]["recipes"]["Insert"];
type RecipeIngredientInsert =
  Database["public"]["Tables"]["recipe_ingredients"]["Insert"];
type AdminClient = SupabaseClient<Database>;

const BATCH_SIZE = 500;
const CRAFTING_SLOTS = [
  "A1",
  "A2",
  "A3",
  "B1",
  "B2",
  "B3",
  "C1",
  "C2",
  "C3",
] as const;

const TIER_KEYWORDS = [
  "COMMON",
  "UNCOMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "MYTHIC",
  "DIVINE",
  "SPECIAL",
  "VERY SPECIAL",
] as const;

interface NeuItemJson {
  internalname?: string;
  itemid?: string;
  displayname?: string;
  lore?: string[];
  parent?: string;
  slayer_req?: string;
  crafttext?: string;
  infoType?: string;
  info?: string[];
  recipe?: Record<string, string | number>;
  recipes?: NeuRecipeJson[];
  nbttag?: string;
  [key: string]: unknown;
}

interface NeuRecipeJson {
  type?: string;
  count?: number;
  duration?: number;
  inputs?: string[];
  [key: string]: string | number | string[] | undefined;
}

interface ParsedIngredient {
  internalId: string;
  quantity: number;
  slotPosition: string | null;
}

interface ParsedRecipe {
  type: RecipeType;
  resultCount: number;
  durationSeconds: number | null;
  rawRecipeData: Record<string, unknown>;
  ingredients: ParsedIngredient[];
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function stripColorCodes(text: string): string {
  return text.replace(/\u00a7./g, "").replace(/§./g, "").trim();
}

function parseCategoryAndTier(lore: string[] | undefined): {
  category: string | null;
  tier: string | null;
} {
  if (!lore || lore.length === 0) {
    return { category: null, tier: null };
  }

  const lastLine = stripColorCodes(lore[lore.length - 1] ?? "");
  if (!lastLine) {
    return { category: null, tier: null };
  }

  let tier: string | null = null;
  for (const keyword of TIER_KEYWORDS) {
    if (lastLine.toUpperCase().includes(keyword)) {
      tier = keyword;
      break;
    }
  }

  const category = lastLine
    .replace(
      new RegExp(TIER_KEYWORDS.join("|"), "gi"),
      "",
    )
    .trim();

  return {
    tier,
    category: category.length > 0 ? category : null,
  };
}

function parseIngredientSlot(
  slot: string,
): { internalId: string; quantity: number } | null {
  const trimmed = slot.trim();
  if (!trimmed) {
    return null;
  }

  const colonIndex = trimmed.lastIndexOf(":");
  if (colonIndex === -1) {
    return { internalId: trimmed, quantity: 1 };
  }

  const internalId = trimmed.slice(0, colonIndex);
  const quantity = Number.parseInt(trimmed.slice(colonIndex + 1), 10);

  if (!internalId || Number.isNaN(quantity) || quantity <= 0) {
    return null;
  }

  return { internalId, quantity };
}

function extractWikiUrl(infoType: string | undefined, info: string[] | undefined): string | null {
  if (infoType === "WIKI_URL" && info && info.length > 0) {
    return info[0] ?? null;
  }
  return null;
}

function parseCraftingIngredients(
  recipe: Record<string, string | number>,
): ParsedIngredient[] {
  const ingredients: ParsedIngredient[] = [];

  for (const slot of CRAFTING_SLOTS) {
    const raw = recipe[slot];
    if (typeof raw !== "string") {
      continue;
    }

    const parsed = parseIngredientSlot(raw);
    if (parsed) {
      ingredients.push({
        internalId: parsed.internalId,
        quantity: parsed.quantity,
        slotPosition: slot,
      });
    }
  }

  return ingredients;
}

function parseForgeIngredients(recipe: NeuRecipeJson): ParsedIngredient[] {
  const inputs = recipe.inputs ?? [];
  const ingredients: ParsedIngredient[] = [];

  for (const input of inputs) {
    if (typeof input !== "string") {
      continue;
    }

    const parsed = parseIngredientSlot(input);
    if (parsed) {
      ingredients.push({
        internalId: parsed.internalId,
        quantity: parsed.quantity,
        slotPosition: null,
      });
    }
  }

  return ingredients;
}

function normalizeRecipeType(type: string | undefined): RecipeType | null {
  if (type === "crafting" || type === "forge") {
    return type;
  }
  return null;
}

function parseRecipes(neu: NeuItemJson): ParsedRecipe[] {
  const parsed: ParsedRecipe[] = [];

  if (neu.recipe && typeof neu.recipe === "object") {
    const resultCount =
      typeof neu.recipe.count === "number" ? neu.recipe.count : 1;

    parsed.push({
      type: "crafting",
      resultCount,
      durationSeconds: null,
      rawRecipeData: neu.recipe as Record<string, unknown>,
      ingredients: parseCraftingIngredients(neu.recipe),
    });
  }

  if (Array.isArray(neu.recipes)) {
    for (const recipe of neu.recipes) {
      const type = normalizeRecipeType(recipe.type);
      if (!type) {
        continue;
      }

      const resultCount =
        typeof recipe.count === "number" ? recipe.count : 1;
      const durationSeconds =
        typeof recipe.duration === "number" ? recipe.duration : null;

      const ingredients =
        type === "forge"
          ? parseForgeIngredients(recipe)
          : parseCraftingIngredients(
              recipe as Record<string, string | number>,
            );

      parsed.push({
        type,
        resultCount,
        durationSeconds,
        rawRecipeData: recipe as Record<string, unknown>,
        ingredients,
      });
    }
  }

  return parsed;
}

function parseNeuItem(
  filePath: string,
  raw: NeuItemJson,
): ItemInsert | null {
  const internalId =
    raw.internalname ?? path.basename(filePath, ".json");

  if (!internalId) {
    return null;
  }

  const displayName = stripColorCodes(raw.displayname ?? internalId);
  const { category, tier } = parseCategoryAndTier(raw.lore);

  return {
    internal_id: internalId,
    display_name: displayName,
    category,
    tier,
    minecraft_item_id: raw.itemid ?? null,
    parent_id: raw.parent ?? null,
    slayer_req: raw.slayer_req ?? null,
    craft_text: raw.crafttext ?? null,
    wiki_url: extractWikiUrl(raw.infoType, raw.info),
    raw_neu_data: raw as Record<string, unknown>,
  };
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function readNeuItemFiles(itemsDir: string): Promise<
  { filePath: string; raw: NeuItemJson }[]
> {
  const entries = await readdir(itemsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(itemsDir, entry.name));

  const results: { filePath: string; raw: NeuItemJson }[] = [];

  for (const filePath of files) {
    try {
      const content = await readFile(filePath, "utf-8");
      const raw = JSON.parse(content) as NeuItemJson;
      results.push({ filePath, raw });
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }
  }

  return results;
}

async function upsertItems(
  supabase: AdminClient,
  items: ItemInsert[],
): Promise<void> {
  const batches = chunk(items, BATCH_SIZE);

  for (const [index, batch] of batches.entries()) {
    const { error } = await supabase
      .from("items")
      .upsert(batch, { onConflict: "internal_id" });

    if (error) {
      throw new Error(
        `Item upsert failed (batch ${index + 1}/${batches.length}): ${error.message}`,
      );
    }

    console.log(`Upserted items batch ${index + 1}/${batches.length}`);
  }
}

async function fetchItemIdMap(
  supabase: AdminClient,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("items")
      .select("id, internal_id")
      .range(from, from + pageSize - 1);

    if (error) {
      throw new Error(`Failed to fetch item id map: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    for (const row of data) {
      map.set(row.internal_id, row.id);
    }

    if (data.length < pageSize) {
      break;
    }

    from += pageSize;
  }

  return map;
}

async function deleteAllRecipes(supabase: AdminClient): Promise<void> {
  const { error } = await supabase
    .from("recipes")
    .delete()
    .not("id", "is", null);

  if (error) {
    throw new Error(`Failed to delete existing recipes: ${error.message}`);
  }

  console.log("Deleted existing recipes (ingredients cascade-deleted)");
}

async function insertRecipesAndIngredients(
  supabase: AdminClient,
  recipes: RecipeInsert[],
  ingredients: RecipeIngredientInsert[],
): Promise<void> {
  const recipeBatches = chunk(recipes, BATCH_SIZE);

  for (const [index, batch] of recipeBatches.entries()) {
    const { error } = await supabase.from("recipes").insert(batch);

    if (error) {
      throw new Error(
        `Recipe insert failed (batch ${index + 1}/${recipeBatches.length}): ${error.message}`,
      );
    }

    console.log(`Inserted recipes batch ${index + 1}/${recipeBatches.length}`);
  }

  const ingredientBatches = chunk(ingredients, BATCH_SIZE);

  for (const [index, batch] of ingredientBatches.entries()) {
    const { error } = await supabase.from("recipe_ingredients").insert(batch);

    if (error) {
      throw new Error(
        `Ingredient insert failed (batch ${index + 1}/${ingredientBatches.length}): ${error.message}`,
      );
    }

    console.log(
      `Inserted ingredients batch ${index + 1}/${ingredientBatches.length}`,
    );
  }
}

async function main(): Promise<void> {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const neuRepoPath = process.env.NEU_REPO_PATH ?? "./neu-data";
  const itemsDir = path.resolve(neuRepoPath, "items");

  console.log(`NEU items directory: ${itemsDir}`);

  const supabase: AdminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const neuFiles = await readNeuItemFiles(itemsDir);
  console.log(`Found ${neuFiles.length} NEU item files`);

  const items: ItemInsert[] = [];
  const itemRecipes: { internalId: string; recipes: ParsedRecipe[] }[] = [];
  const knownInternalIds = new Set<string>();

  for (const { filePath, raw } of neuFiles) {
    const item = parseNeuItem(filePath, raw);
    if (!item) {
      continue;
    }

    knownInternalIds.add(item.internal_id);
    items.push(item);

    const recipes = parseRecipes(raw);
    if (recipes.length > 0) {
      itemRecipes.push({ internalId: item.internal_id, recipes });
    }
  }

  for (const item of items) {
    if (item.parent_id && !knownInternalIds.has(item.parent_id)) {
      console.warn(
        `Parent not found in NEU repo, clearing parent_id: ${item.internal_id} -> ${item.parent_id}`,
      );
      item.parent_id = null;
    }
  }

  console.log(`Parsed ${items.length} items, ${itemRecipes.length} with recipes`);

  // Pass 1: upsert without parent_id (FK is checked per statement, not deferred via REST API)
  const parentByInternalId = new Map<string, string>();
  for (const item of items) {
    if (item.parent_id) {
      parentByInternalId.set(item.internal_id, item.parent_id);
      item.parent_id = null;
    }
  }

  await upsertItems(supabase, items);

  // Pass 2: set parent_id now that all items exist
  const itemsWithParents = items.filter((item) =>
    parentByInternalId.has(item.internal_id),
  );
  for (const item of itemsWithParents) {
    item.parent_id = parentByInternalId.get(item.internal_id) ?? null;
  }

  if (itemsWithParents.length > 0) {
    console.log(`Linking ${itemsWithParents.length} parent references`);
    await upsertItems(supabase, itemsWithParents);
  }

  const idMap = await fetchItemIdMap(supabase);
  console.log(`Loaded ${idMap.size} item IDs from database`);

  const recipeRows: RecipeInsert[] = [];
  const ingredientRows: RecipeIngredientInsert[] = [];
  let skippedIngredients = 0;

  for (const { internalId, recipes } of itemRecipes) {
    const resultItemId = idMap.get(internalId);
    if (!resultItemId) {
      console.warn(`Result item not found in map: ${internalId}`);
      continue;
    }

    for (const recipe of recipes) {
      const recipeId = randomUUID();

      recipeRows.push({
        id: recipeId,
        result_item_id: resultItemId,
        type: recipe.type,
        result_count: recipe.resultCount,
        duration_seconds: recipe.durationSeconds,
        raw_recipe_data: recipe.rawRecipeData,
      });

      for (const ingredient of recipe.ingredients) {
        const ingredientItemId = idMap.get(ingredient.internalId);
        if (!ingredientItemId) {
          skippedIngredients += 1;
          continue;
        }

        ingredientRows.push({
          recipe_id: recipeId,
          ingredient_item_id: ingredientItemId,
          quantity: ingredient.quantity,
          slot_position: ingredient.slotPosition,
        });
      }
    }
  }

  console.log(
    `Prepared ${recipeRows.length} recipes and ${ingredientRows.length} ingredients (${skippedIngredients} skipped)`,
  );

  await deleteAllRecipes(supabase);
  await insertRecipesAndIngredients(supabase, recipeRows, ingredientRows);

  console.log("NEU ingestion completed successfully");
}

main().catch((error) => {
  console.error("NEU ingestion failed:", error);
  process.exit(1);
});
