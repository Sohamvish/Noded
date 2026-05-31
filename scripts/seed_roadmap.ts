/**
 * Seed curated roadmap skills + milestone items for the browse sidebar.
 *
 * Requires NEU ingestion first (`npm run ingest`) so referenced items exist.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Locally, values are loaded from .env.local via dotenv.
 */

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

type AdminClient = SupabaseClient<Database>;

type SkillSeed = Database["public"]["Tables"]["roadmap_skills"]["Insert"];
type MilestoneSeed = Omit<
  Database["public"]["Tables"]["roadmap_items"]["Insert"],
  "internal_id"
> & { internalId: string };

const SKILLS: SkillSeed[] = [
  { id: "COMBAT", display_name: "Combat", sort_order: 1, color: "#ef4444" },
  { id: "MINING", display_name: "Mining", sort_order: 2, color: "#f59e0b" },
  { id: "FARMING", display_name: "Farming", sort_order: 3, color: "#22c55e" },
  { id: "FORAGING", display_name: "Foraging", sort_order: 4, color: "#84cc16" },
  { id: "FISHING", display_name: "Fishing", sort_order: 5, color: "#06b6d4" },
  { id: "ENCHANTING", display_name: "Enchanting", sort_order: 6, color: "#a855f7" },
  { id: "ALCHEMY", display_name: "Alchemy", sort_order: 7, color: "#ec4899" },
  { id: "DUNGEONEERING", display_name: "Dungeoneering", sort_order: 8, color: "#6366f1" },
  { id: "SLAYER", display_name: "Slayer", sort_order: 9, color: "#dc2626" },
];

/** layer 1 = early, 5 = endgame */
const MILESTONES: MilestoneSeed[] = [
  // Combat
  { internalId: "END_SWORD", skill_id: "COMBAT", layer: 1, sort_order: 1 },
  { internalId: "ASPECT_OF_THE_END", skill_id: "COMBAT", layer: 1, sort_order: 2, label_override: "AOTE" },
  { internalId: "BONE_BOOMERANG", skill_id: "COMBAT", layer: 2, sort_order: 1 },
  { internalId: "ASPECT_OF_THE_DRAGON", skill_id: "COMBAT", layer: 2, sort_order: 2, label_override: "AOTD" },
  { internalId: "BOSS_SPIRIT_BOW", skill_id: "COMBAT", layer: 2, sort_order: 3, label_override: "Spirit Bow" },
  { internalId: "GIANTS_SWORD", skill_id: "COMBAT", layer: 3, sort_order: 1 },
  { internalId: "LIVID_DAGGER", skill_id: "COMBAT", layer: 3, sort_order: 2 },
  { internalId: "VALKYRIE", skill_id: "COMBAT", layer: 3, sort_order: 3 },
  { internalId: "SHADOW_FURY", skill_id: "COMBAT", layer: 3, sort_order: 4 },
  { internalId: "HYPERION", skill_id: "COMBAT", layer: 4, sort_order: 1 },
  { internalId: "ASTRAEA", skill_id: "COMBAT", layer: 4, sort_order: 2 },
  { internalId: "SCYLLA", skill_id: "COMBAT", layer: 4, sort_order: 3 },
  { internalId: "TERMINATOR", skill_id: "COMBAT", layer: 5, sort_order: 1 },

  // Mining
  { internalId: "PROMISING_PICKAXE", skill_id: "MINING", layer: 1, sort_order: 1 },
  { internalId: "ROOKIE_PICKAXE", skill_id: "MINING", layer: 1, sort_order: 2 },
  { internalId: "STONK_PICKAXE", skill_id: "MINING", layer: 1, sort_order: 3, label_override: "Stonk" },
  { internalId: "MITHRIL_PICKAXE", skill_id: "MINING", layer: 2, sort_order: 1 },
  { internalId: "TITANIUM_PICKAXE", skill_id: "MINING", layer: 2, sort_order: 2 },
  { internalId: "GEMSTONE_GAUNTLET", skill_id: "MINING", layer: 3, sort_order: 1 },
  { internalId: "DIVAN_POWDER_COATING", skill_id: "MINING", layer: 3, sort_order: 2, label_override: "Divan's Powder" },
  { internalId: "DIVAN_DRILL", skill_id: "MINING", layer: 4, sort_order: 1 },
  { internalId: "DIVAN_PENDANT", skill_id: "MINING", layer: 4, sort_order: 2 },
  { internalId: "GEMSTONE_DRILL_4", skill_id: "MINING", layer: 5, sort_order: 1, label_override: "Jasper Drill X" },

  // Farming
  { internalId: "FARM_SUIT_HELMET", skill_id: "FARMING", layer: 1, sort_order: 1, label_override: "Farm Suit" },
  { internalId: "RANCHERS_BOOTS", skill_id: "FARMING", layer: 1, sort_order: 2 },
  { internalId: "CACTUS_KNIFE", skill_id: "FARMING", layer: 2, sort_order: 1 },
  { internalId: "CACTUS_BOOTS", skill_id: "FARMING", layer: 2, sort_order: 2 },
  { internalId: "MELON_DICER_3", skill_id: "FARMING", layer: 3, sort_order: 1 },
  { internalId: "PUMPKIN_DICER_3", skill_id: "FARMING", layer: 3, sort_order: 2 },
  { internalId: "FERMENTO_HELMET", skill_id: "FARMING", layer: 4, sort_order: 1, label_override: "Fermento" },
  { internalId: "SQUASH_HELMET", skill_id: "FARMING", layer: 5, sort_order: 1, label_override: "Squash" },

  // Foraging
  { internalId: "ROOKIE_AXE", skill_id: "FORAGING", layer: 1, sort_order: 1 },
  { internalId: "EFFICIENT_AXE", skill_id: "FORAGING", layer: 1, sort_order: 2 },
  { internalId: "FORAGING_1_PORTAL", skill_id: "FORAGING", layer: 2, sort_order: 1, label_override: "Foraging Portal" },
  { internalId: "JUNGLE_AXE", skill_id: "FORAGING", layer: 3, sort_order: 1 },
  { internalId: "DAEDALUS_AXE", skill_id: "FORAGING", layer: 3, sort_order: 2 },
  { internalId: "FIGSTONE_AXE", skill_id: "FORAGING", layer: 4, sort_order: 1 },
  { internalId: "BURSTFIRE_DAGGER", skill_id: "FORAGING", layer: 4, sort_order: 2 },
  { internalId: "FORAGING_4_PORTAL", skill_id: "FORAGING", layer: 5, sort_order: 1, label_override: "Galatea Portal" },

  // Fishing
  { internalId: "ROD_OF_THE_SEA", skill_id: "FISHING", layer: 1, sort_order: 1 },
  { internalId: "FULL_CHUM_BUCKET", skill_id: "FISHING", layer: 1, sort_order: 2, label_override: "Chum Bucket" },
  { internalId: "AUGER_ROD", skill_id: "FISHING", layer: 2, sort_order: 1 },
  { internalId: "SHARK_SCALE_HELMET", skill_id: "FISHING", layer: 2, sort_order: 2, label_override: "Shark Scale" },
  { internalId: "YETI_ROD", skill_id: "FISHING", layer: 3, sort_order: 1 },
  { internalId: "THUNDER_IN_A_BOTTLE", skill_id: "FISHING", layer: 4, sort_order: 1 },
  { internalId: "MAGMA_ROD", skill_id: "FISHING", layer: 4, sort_order: 2 },
  { internalId: "GOLDEN_FISH_GOLD", skill_id: "FISHING", layer: 5, sort_order: 1, label_override: "Golden Fish" },

  // Enchanting
  { internalId: "ENCHANTED_BOOK", skill_id: "ENCHANTING", layer: 1, sort_order: 1, label_override: "Ench. Book" },
  { internalId: "ENCHANTED_LAPIS_LAZULI", skill_id: "ENCHANTING", layer: 1, sort_order: 2, label_override: "Ench. Lapis" },
  { internalId: "EXPERIENCE_ARTIFACT", skill_id: "ENCHANTING", layer: 2, sort_order: 1 },
  { internalId: "GRAND_EXP_BOTTLE", skill_id: "ENCHANTING", layer: 2, sort_order: 2, label_override: "Grand XP Bottle" },
  { internalId: "SUPERIOR_DRAGON_HELMET", skill_id: "ENCHANTING", layer: 3, sort_order: 1, label_override: "Superior" },
  { internalId: "TITANIC_EXP_BOTTLE", skill_id: "ENCHANTING", layer: 3, sort_order: 2 },
  { internalId: "ENCHANTED_BOOK_BUNDLE_THE_ONE", skill_id: "ENCHANTING", layer: 4, sort_order: 1, label_override: "The One Bundle" },
  { internalId: "ENCHANTED_BOOK_BUNDLE_VICIOUS", skill_id: "ENCHANTING", layer: 4, sort_order: 2, label_override: "Vicious Bundle" },

  // Alchemy
  { internalId: "HEALING_TALISMAN", skill_id: "ALCHEMY", layer: 1, sort_order: 1 },
  { internalId: "POTION_AFFINITY_TALISMAN", skill_id: "ALCHEMY", layer: 1, sort_order: 2 },
  { internalId: "HEALING_RING", skill_id: "ALCHEMY", layer: 2, sort_order: 1 },
  { internalId: "HEALING_TISSUE", skill_id: "ALCHEMY", layer: 2, sort_order: 2 },
  { internalId: "ARTIFACT_POTION_AFFINITY", skill_id: "ALCHEMY", layer: 3, sort_order: 1, label_override: "Potion Affinity Artifact" },
  { internalId: "LESSER_ORB_OF_HEALING", skill_id: "ALCHEMY", layer: 3, sort_order: 2, label_override: "Orb of Healing" },
  { internalId: "RING_POTION_AFFINITY", skill_id: "ALCHEMY", layer: 4, sort_order: 1, label_override: "Potion Affinity Ring" },
  { internalId: "HEALING_MELON", skill_id: "ALCHEMY", layer: 4, sort_order: 2 },

  // Dungeoneering
  { internalId: "BONZO_MASK", skill_id: "DUNGEONEERING", layer: 1, sort_order: 1 },
  { internalId: "ADAPTIVE_HELMET", skill_id: "DUNGEONEERING", layer: 1, sort_order: 2, label_override: "Adaptive" },
  { internalId: "SHADOW_ASSASSIN_HELMET", skill_id: "DUNGEONEERING", layer: 2, sort_order: 1, label_override: "SA" },
  { internalId: "ZOMBIE_SOLDIER_HELMET", skill_id: "DUNGEONEERING", layer: 2, sort_order: 2, label_override: "Zombie Soldier" },
  { internalId: "NECROMANCER_LORD_HELMET", skill_id: "DUNGEONEERING", layer: 3, sort_order: 1, label_override: "Necro Lord" },
  { internalId: "WISE_WITHER_HELMET", skill_id: "DUNGEONEERING", layer: 3, sort_order: 2, label_override: "Storm" },
  { internalId: "TANK_WITHER_HELMET", skill_id: "DUNGEONEERING", layer: 4, sort_order: 1, label_override: "Goldor" },
  { internalId: "SPEED_WITHER_HELMET", skill_id: "DUNGEONEERING", layer: 4, sort_order: 2, label_override: "Maxor" },
  { internalId: "POWER_WITHER_HELMET", skill_id: "DUNGEONEERING", layer: 5, sort_order: 1, label_override: "Necron" },

  // Slayer (cross-cutting)
  { internalId: "REVENANT_SWORD", skill_id: "SLAYER", layer: 1, sort_order: 1 },
  { internalId: "REAPER_SWORD", skill_id: "SLAYER", layer: 1, sort_order: 2, label_override: "Reaper Falchion" },
  { internalId: "VOIDWALKER_KATANA", skill_id: "SLAYER", layer: 2, sort_order: 1 },
  { internalId: "ATOMSPLIT_KATANA", skill_id: "SLAYER", layer: 2, sort_order: 2 },
  { internalId: "VOIDEDGE_KATANA", skill_id: "SLAYER", layer: 3, sort_order: 1 },
  { internalId: "FEL_SWORD", skill_id: "SLAYER", layer: 3, sort_order: 2 },
  { internalId: "AXE_OF_THE_SHREDDED", skill_id: "SLAYER", layer: 4, sort_order: 1, label_override: "Axe of Shredded" },
  { internalId: "DARK_CLAYMORE", skill_id: "SLAYER", layer: 4, sort_order: 2 },
  { internalId: "GYROKINETIC_WAND", skill_id: "SLAYER", layer: 5, sort_order: 1 },
];

function createAdminClient(): AdminClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(url, key);
}

async function seedSkills(client: AdminClient): Promise<void> {
  const { error } = await client.from("roadmap_skills").upsert(SKILLS, {
    onConflict: "id",
  });

  if (error) {
    throw new Error(`Failed to upsert roadmap_skills: ${error.message}`);
  }

  console.log(`Upserted ${SKILLS.length} roadmap skills.`);
}

async function seedMilestones(client: AdminClient): Promise<void> {
  const internalIds = MILESTONES.map((m) => m.internalId);

  const { data: existingItems, error: lookupError } = await client
    .from("items")
    .select("internal_id")
    .in("internal_id", internalIds);

  if (lookupError) {
    throw new Error(`Failed to verify items: ${lookupError.message}`);
  }

  const existing = new Set((existingItems ?? []).map((row) => row.internal_id));
  const missing = internalIds.filter((id) => !existing.has(id));

  if (missing.length > 0) {
    console.warn(
      `Skipping ${missing.length} milestones not found in items table (run ingest first):`,
    );
    for (const id of missing) {
      console.warn(`  - ${id}`);
    }
  }

  const rows = MILESTONES.filter((m) => existing.has(m.internalId)).map(
    (m) => ({
      internal_id: m.internalId,
      skill_id: m.skill_id,
      layer: m.layer,
      sort_order: m.sort_order,
      label_override: m.label_override ?? null,
    }),
  );

  if (rows.length === 0) {
    console.warn("No milestones to upsert — ingest NEU data first.");
    return;
  }

  const { error } = await client.from("roadmap_items").upsert(rows, {
    onConflict: "internal_id",
  });

  if (error) {
    throw new Error(`Failed to upsert roadmap_items: ${error.message}`);
  }

  console.log(`Upserted ${rows.length} roadmap milestones.`);
}

async function main(): Promise<void> {
  const client = createAdminClient();

  console.log("Seeding roadmap skills…");
  await seedSkills(client);

  console.log("Seeding roadmap milestones…");
  await seedMilestones(client);

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
