import { HYPIXEL_SKYBLOCK_PROFILES_URL } from "./constants";
import {
  getHypixelApiKey,
  HypixelApiError,
  readHypixelErrorBody,
} from "./api-errors";
import type { HypixelSkyblockProfile } from "./extract-member-data";

export interface HypixelProfilesResponse {
  success: boolean;
  profiles?: HypixelSkyblockProfile[];
  cause?: string;
}

export async function fetchSkyblockProfiles(
  minecraftUuid: string,
): Promise<HypixelSkyblockProfile[]> {
  const url = new URL(HYPIXEL_SKYBLOCK_PROFILES_URL);
  url.searchParams.set("uuid", minecraftUuid);

  const res = await fetch(url, {
    headers: { "API-Key": getHypixelApiKey() },
    cache: "no-store",
  });

  if (!res.ok) {
    const cause = await readHypixelErrorBody(res);
    throw new HypixelApiError(res.status, cause);
  }

  const data = (await res.json()) as HypixelProfilesResponse;

  if (!data.success) {
    throw new HypixelApiError(502, data.cause ?? "Hypixel API returned success=false");
  }

  return data.profiles ?? [];
}
