import type { DependencySubgraphRow } from "@/types/database";

export interface MaterialRequirement {
  internalId: string;
  requiredQty: number;
  contributingGoals: string[];
}

interface RecipeOption {
  recipeId: string;
  ingredients: Array<{ internalId: string; quantity: number }>;
}

function buildRecipeOptions(
  rows: DependencySubgraphRow[],
): Map<string, RecipeOption[]> {
  const byResult = new Map<string, Map<string, RecipeOption>>();

  for (const row of rows) {
    if (!row.ingredient_internal_id || !row.recipe_id) continue;

    const resultId = row.result_internal_id;
    const recipeId = row.recipe_id;
    let recipesForResult = byResult.get(resultId);
    if (!recipesForResult) {
      recipesForResult = new Map();
      byResult.set(resultId, recipesForResult);
    }

    let recipe = recipesForResult.get(recipeId);
    if (!recipe) {
      recipe = { recipeId, ingredients: [] };
      recipesForResult.set(recipeId, recipe);
    }

    recipe.ingredients.push({
      internalId: row.ingredient_internal_id,
      quantity: Number(row.quantity ?? 1),
    });
  }

  const out = new Map<string, RecipeOption[]>();
  for (const [resultId, recipeMap] of byResult) {
    out.set(resultId, [...recipeMap.values()]);
  }
  return out;
}

function pickPrimaryRecipe(
  options: RecipeOption[] | undefined,
): RecipeOption | null {
  if (!options || options.length === 0) return null;
  return [...options].sort(
    (a, b) => a.ingredients.length - b.ingredients.length,
  )[0];
}

export function rollupMaterialsForTarget(
  rows: DependencySubgraphRow[],
  targetInternalId: string,
  targetQty = 1,
): Map<string, number> {
  const recipeOptions = buildRecipeOptions(rows);
  const requirements = new Map<string, number>();
  const visiting = new Set<string>();

  function accumulate(itemId: string, multiplier: number) {
    if (multiplier <= 0) return;

    const recipes = recipeOptions.get(itemId);
    const recipe = pickPrimaryRecipe(recipes);

    if (!recipe) {
      requirements.set(itemId, (requirements.get(itemId) ?? 0) + multiplier);
      return;
    }

    if (visiting.has(itemId)) return;
    visiting.add(itemId);

    for (const ing of recipe.ingredients) {
      accumulate(ing.internalId, multiplier * ing.quantity);
    }

    visiting.delete(itemId);
  }

  accumulate(targetInternalId, targetQty);
  return requirements;
}

export function mergeMaterialMaps(
  maps: Array<Map<string, number>>,
  goalIds: string[],
): MaterialRequirement[] {
  const merged = new Map<string, { qty: number; goals: Set<string> }>();

  maps.forEach((map, index) => {
    const goalId = goalIds[index] ?? "unknown";
    for (const [internalId, qty] of map) {
      const existing = merged.get(internalId);
      if (existing) {
        existing.qty += qty;
        existing.goals.add(goalId);
      } else {
        merged.set(internalId, { qty, goals: new Set([goalId]) });
      }
    }
  });

  return [...merged.entries()]
    .map(([internalId, { qty, goals }]) => ({
      internalId,
      requiredQty: qty,
      contributingGoals: [...goals],
    }))
    .sort(
      (a, b) =>
        b.requiredQty - a.requiredQty ||
        a.internalId.localeCompare(b.internalId),
    );
}

export function getOwnedQuantity(
  internalId: string,
  completedItems: string[],
  collections: Record<string, number>,
  requiredQty: number,
): number {
  if (completedItems.includes(internalId)) {
    return Math.max(1, requiredQty);
  }

  if (collections[internalId] != null) {
    return collections[internalId];
  }

  const base = internalId.replace(/^ENCHANTED_/, "").replace(/^ENCHANTED/, "");
  if (base !== internalId && collections[base] != null) {
    return collections[base];
  }

  return 0;
}
