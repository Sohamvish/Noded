import { LAYER_LABELS } from "@/lib/dashboard/constants";

/** Map item tier to a progression layer (1 = early, 5 = peak). */
export const LAYER_TIERS: Record<number, readonly string[]> = {
  1: ["COMMON", "UNCOMMON"],
  2: ["RARE"],
  3: ["EPIC"],
  4: ["LEGENDARY"],
  5: ["MYTHIC", "DIVINE", "SPECIAL", "VERY SPECIAL"],
};

export function layerLabel(layer: number): string {
  return LAYER_LABELS[layer] ?? `Layer ${layer}`;
}

export function tierToLayer(tier: string | null | undefined): number {
  if (!tier) return 1;
  const upper = tier.toUpperCase();
  for (const [layer, tiers] of Object.entries(LAYER_TIERS)) {
    if (tiers.includes(upper)) return Number(layer);
  }
  return 1;
}

export function tiersForLayer(layer: number): string[] {
  return [...(LAYER_TIERS[layer] ?? LAYER_TIERS[1])];
}

/**
 * Heuristic skill assignment from NEU category strings and internal ids.
 * Curated roadmap_items always override these when present.
 */
const SKILL_MATCHERS: Record<string, RegExp[]> = {
  COMBAT: [
    /SWORD/i,
    /BOW/i,
    /WEAPON/i,
    /HELMET/i,
    /CHESTPLATE/i,
    /LEGGINGS/i,
    /BOOTS/i,
    /GLOVES/i,
    /BELT/i,
    /NECKLACE/i,
    /CLOAK/i,
    /BRACELET/i,
    /RING/i,
    /ARTIFACT/i,
    /WAND/i,
    /STAFF/i,
    /DUNGEON/i,
    /WITHER/i,
    /NECRON/i,
    /HYPERION/i,
    /ASTRAEA/i,
    /SCYLLA/i,
    /VALKYRIE/i,
  ],
  MINING: [
    /MINING/i,
    /DRILL/i,
    /PICKAXE/i,
    /GEM/i,
    /REFINED/i,
    /MITHRIL/i,
    /TITANIUM/i,
    /HOTM/i,
    /DWARVEN/i,
    /POWDER/i,
  ],
  FARMING: [/FARMING/i, /HOE/i, /CROP/i, /BARN/i, /GARDEN/i, /JACOB/i],
  FORAGING: [/FORAGING/i, /FOREST/i, /SAPLING/i],
  FISHING: [/FISHING/i, /ROD/i, /FISH/i, /AQUATIC/i, /CHUM/i, /BAIT/i],
  ENCHANTING: [
    /ENCHANT/i,
    /EXPERIENCE/i,
    /EXP TABLE/i,
    /GUIDE/i,
    /TOME/i,
    /BOOK/i,
  ],
  ALCHEMY: [/ALCHEMY/i, /POTION/i, /BREW/i, /SPLASH/i, /FLASK/i],
  DUNGEONEERING: [
    /DUNGEON/i,
    /CATACOMB/i,
    /BONZO/i,
    /SPIRIT/i,
    /ADAPT/i,
    /STAR/i,
    /HECAT/i,
    /LIVID/i,
    /FEL/i,
  ],
  SLAYER: [
    /SLAYER/i,
    /REVENANT/i,
    /TARANTULA/i,
    /SVEN/i,
    /VOIDLING/i,
    /ATOM/i,
    /OVERFLUX/i,
  ],
};

export function itemMatchesSkill(
  skillId: string,
  category: string | null | undefined,
  internalId: string,
): boolean {
  const patterns = SKILL_MATCHERS[skillId];
  if (!patterns) return false;
  const haystack = `${category ?? ""} ${internalId.replace(/_/g, " ")}`;
  return patterns.some((pattern) => pattern.test(haystack));
}

/** PostgREST ilike patterns for category column (subset of matchers). */
export function categoryIlikePatterns(skillId: string): string[] {
  const keywords: Record<string, string[]> = {
    COMBAT: ["SWORD", "BOW", "HELMET", "CHEST", "LEGGINGS", "BOOTS", "WEAPON"],
    MINING: ["MINING", "DRILL", "PICKAXE", "GEM", "MITHRIL"],
    FARMING: ["FARMING", "HOE", "CROP"],
    FORAGING: ["FORAGING", "AXE"],
    FISHING: ["FISHING", "ROD", "FISH"],
    ENCHANTING: ["ENCHANT", "BOOK", "TOME"],
    ALCHEMY: ["POTION", "ALCHEMY", "BREW"],
    DUNGEONEERING: ["DUNGEON", "CATACOMB"],
    SLAYER: ["SLAYER", "REVENANT", "TARANTULA", "SVEN"],
  };

  return (keywords[skillId] ?? []).map((k) => `%${k}%`);
}

export function buildCategoryOrFilter(skillId: string): string | null {
  const patterns = categoryIlikePatterns(skillId);
  if (patterns.length === 0) return null;
  return patterns.map((p) => `category.ilike.${p}`).join(",");
}
