import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-user";
import type {
  ItemDetailApiResponse,
  RecipeDetail,
  RecipeIngredientDetail,
} from "@/lib/items/types";
import { parseNeuDisplay } from "@/lib/items/parse-neu-display";
import type { RecipeType } from "@/types/database";

type RouteContext = { params: Promise<{ internalId: string }> };

interface IngredientRow {
  quantity: number;
  slot_position: string | null;
  items: {
    internal_id: string;
    display_name: string;
    tier: string | null;
  } | null;
}

interface RecipeRow {
  id: string;
  type: RecipeType;
  result_count: number;
  duration_seconds: number | null;
  recipe_ingredients: IngredientRow[];
}

interface ItemRow {
  internal_id: string;
  display_name: string;
  tier: string | null;
  category: string | null;
  soulbound: boolean;
  slayer_req: string | null;
  craft_text: string | null;
  wiki_url: string | null;
  raw_neu_data: Record<string, unknown> | null;
  recipes: RecipeRow[];
}

function mapRecipe(row: RecipeRow): RecipeDetail {
  const ingredients: RecipeIngredientDetail[] = (row.recipe_ingredients ?? [])
    .filter((ing) => ing.items !== null)
    .map((ing) => ({
      internalId: ing.items!.internal_id,
      displayName: ing.items!.display_name,
      tier: ing.items!.tier,
      quantity: ing.quantity,
      slotPosition: ing.slot_position,
    }));

  return {
    id: row.id,
    type: row.type,
    resultCount: row.result_count,
    durationSeconds: row.duration_seconds,
    ingredients,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const { internalId: rawId } = await context.params;
  const internalId = rawId?.trim().toUpperCase() ?? "";

  if (!internalId) {
    return NextResponse.json({ error: "Missing item id." }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select(
      `
      internal_id,
      display_name,
      tier,
      category,
      soulbound,
      slayer_req,
      craft_text,
      wiki_url,
      raw_neu_data,
      recipes (
        id,
        type,
        result_count,
        duration_seconds,
        recipe_ingredients (
          quantity,
          slot_position,
          items!recipe_ingredients_ingredient_item_id_fkey (
            internal_id,
            display_name,
            tier
          )
        )
      )
    `,
    )
    .eq("internal_id", internalId)
    .maybeSingle();

  if (error) {
    console.error("[api/items]", error);
    return NextResponse.json(
      { error: "Failed to load item details." },
      { status: 500 },
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: `Item not found: ${internalId}` },
      { status: 404 },
    );
  }

  const item = data as unknown as ItemRow;

  let completed: boolean | null = null;
  const user = await getAuthUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("completed_items")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.completed_items) {
      completed = profile.completed_items.includes(internalId);
    } else {
      completed = false;
    }
  }

  const display = parseNeuDisplay(item.raw_neu_data, item.internal_id);

  const body: ItemDetailApiResponse = {
    internalId: item.internal_id,
    displayName: item.display_name,
    tier: item.tier,
    category: item.category,
    soulbound: item.soulbound,
    slayerReq: item.slayer_req,
    craftText: item.craft_text,
    wikiUrl: item.wiki_url,
    recipes: (item.recipes ?? []).map(mapRecipe),
    completed,
    coloredName: display.coloredName,
    loreLines: display.loreLines,
    iconUrl: display.iconUrl,
  };

  return NextResponse.json(body);
}
