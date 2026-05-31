import type { RecipeType } from "@/types/database";

export interface RecipeIngredientDetail {
  internalId: string;
  displayName: string;
  tier: string | null;
  quantity: number;
  slotPosition: string | null;
}

export interface RecipeDetail {
  id: string;
  type: RecipeType;
  resultCount: number;
  durationSeconds: number | null;
  ingredients: RecipeIngredientDetail[];
}

export interface ItemDetailApiResponse {
  internalId: string;
  displayName: string;
  tier: string | null;
  category: string | null;
  soulbound: boolean;
  slayerReq: string | null;
  craftText: string | null;
  wikiUrl: string | null;
  recipes: RecipeDetail[];
  completed: boolean | null;
  /** NEU colored display name (§ codes). */
  coloredName: string | null;
  /** NEU lore lines for wiki-style tooltip. */
  loreLines: string[];
  iconUrl: string | null;
}

export interface MaterialLine {
  internalId: string;
  displayName: string;
  tier: string | null;
  requiredQty: number;
  ownedQty: number | null;
  progressPct: number | null;
  source: "craft" | "terminal";
  hint: string | null;
  iconUrl: string | null;
  coloredName: string | null;
  loreLines: string[];
  contributingGoals: string[];
}

export interface MaterialsApiResponse {
  lines: MaterialLine[];
  expandBases: boolean;
  goalIds: string[];
  disclaimer: string;
}

export interface ProfileApiResponse {
  minecraftUsername: string | null;
  profileCuteName: string | null;
  completedItems: string[];
  cachedCollections: Record<string, number>;
  cachedSkills: Record<string, number>;
  lastSyncAt: string | null;
}

export interface GoalItem {
  id: string;
  internalId: string;
  displayName: string;
  tier: string | null;
  sortOrder: number;
}

export interface GoalsApiResponse {
  goals: GoalItem[];
  maxGoals: number;
}

export interface ItemSearchResult {
  internalId: string;
  displayName: string;
  tier: string | null;
  category: string | null;
}

export interface ItemSearchApiResponse {
  results: ItemSearchResult[];
  query: string;
}
