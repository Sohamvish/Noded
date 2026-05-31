import { addUuidDashes, stripUuidDashes } from "./uuid";

export interface HypixelSkyblockProfile {
  profile_id: string;
  cute_name: string;
  selected?: boolean;
  game_mode?: string;
  members: Record<string, HypixelMember>;
}

export interface HypixelMember {
  collection?: Record<string, number | Record<string, number>>;
  player_data?: {
    experience?: Record<string, number>;
  };
  inventory?: Record<string, unknown>;
  [key: string]: unknown;
}

export function pickProfile(
  profiles: HypixelSkyblockProfile[],
  profileId?: string,
): HypixelSkyblockProfile | null {
  if (profiles.length === 0) return null;

  if (profileId) {
    const match = profiles.find((p) => p.profile_id === profileId);
    if (match) return match;
  }

  return profiles.find((p) => p.selected) ?? profiles[0];
}

export function findMember(
  profile: HypixelSkyblockProfile,
  minecraftUuid: string,
): HypixelMember | null {
  const compact = stripUuidDashes(minecraftUuid);
  const dashed = addUuidDashes(compact);

  return (
    profile.members[compact] ??
    profile.members[dashed] ??
    profile.members[minecraftUuid] ??
    null
  );
}

/** Flatten collection object (supports legacy nested skill buckets). */
export function flattenCollections(
  collection: HypixelMember["collection"],
): Record<string, number> {
  if (!collection) return {};

  const out: Record<string, number> = {};

  for (const [key, value] of Object.entries(collection)) {
    if (typeof value === "number") {
      out[key] = value;
    } else if (value && typeof value === "object") {
      for (const [itemId, count] of Object.entries(value)) {
        if (typeof count === "number") {
          out[itemId] = count;
        }
      }
    }
  }

  return out;
}

export function extractSkills(
  experience: Record<string, number> | undefined,
): Record<string, number> {
  if (!experience) return {};

  const out: Record<string, number> = {};

  for (const [key, value] of Object.entries(experience)) {
    if (!key.startsWith("SKILL_") || typeof value !== "number") continue;
    const skill = key.slice("SKILL_".length).toLowerCase();
    out[skill] = value;
  }

  return out;
}
