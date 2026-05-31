import { MOJANG_PROFILE_URL } from "./constants";
import { stripUuidDashes } from "./uuid";

export interface MojangProfile {
  uuid: string;
  name: string;
}

export async function fetchMojangProfile(
  username: string,
): Promise<MojangProfile | null> {
  const encoded = encodeURIComponent(username.trim());
  const res = await fetch(`${MOJANG_PROFILE_URL}/${encoded}`, {
    next: { revalidate: 300 },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`Mojang lookup failed (${res.status})`);
  }

  const data = (await res.json()) as { id?: string; name?: string };
  if (!data.id || !data.name) return null;

  return {
    uuid: stripUuidDashes(data.id),
    name: data.name,
  };
}
