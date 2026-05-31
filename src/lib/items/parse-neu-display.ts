/**
 * Extract wiki-style display fields from NEU raw_neu_data.
 * Mirrors what the Fandom wiki stores in Module:Inventory slot/Tooltips:
 * colored display name + lore lines with § formatting codes.
 */

export interface ItemDisplayData {
  coloredName: string | null;
  loreLines: string[];
  minecraftItemId: string | null;
  iconUrl: string | null;
}

interface SkullTexturePayload {
  textures?: Array<{ URL?: string }>;
}

function decodeSkullTextureUrl(base64Value: string): string | null {
  try {
    const json = Buffer.from(base64Value, "base64").toString("utf8");
    const payload = JSON.parse(json) as SkullTexturePayload;
    const url = payload.textures?.[0]?.URL;
    return url && url.startsWith("http") ? url : null;
  } catch {
    return null;
  }
}

/** Extract skull texture URL from NEU nbttag string. */
function extractSkullUrlFromNbttag(nbttag: unknown): string | null {
  if (typeof nbttag !== "string" || !nbttag.includes("SkullOwner")) return null;

  const valueMatch = nbttag.match(/Value:"([^"]+)"/);
  if (valueMatch?.[1]) {
    const url = decodeSkullTextureUrl(valueMatch[1]);
    if (url) return url;
  }

  const uuidMatch = nbttag.match(
    /Id:"([0-9a-f-]{36})"|Id:([0-9a-f]{32})/i,
  );
  const uuid = uuidMatch?.[1] ?? uuidMatch?.[2];
  if (uuid) {
    const clean = uuid.replace(/-/g, "");
    return `https://mc-heads.net/head/${clean}/32`;
  }

  return null;
}

function normalizeItemTextureName(itemid: string): string | null {
  const raw = itemid.includes(":") ? itemid.split(":")[1] : itemid;
  if (!raw) return null;
  return raw.toLowerCase();
}

function resolveVanillaIconUrl(itemid: string): string | null {
  const name = normalizeItemTextureName(itemid);
  if (!name) return null;

  if (name === "skull" || name === "skull_item") return null;

  return `https://assets.mcasset.cloud/1.8.9/assets/minecraft/textures/item/${name}.png`;
}

export function resolveItemIconUrl(
  raw: Record<string, unknown> | null,
  internalId: string,
): string | null {
  if (!raw) return null;

  const skullUrl = extractSkullUrlFromNbttag(raw.nbttag);
  if (skullUrl) return skullUrl;

  const itemid = typeof raw.itemid === "string" ? raw.itemid : null;
  if (itemid) {
    const vanilla = resolveVanillaIconUrl(itemid);
    if (vanilla) return vanilla;
  }

  // Fallback: NEU hosted repo icon path (may 404 for some items)
  return `https://raw.githubusercontent.com/NotEnoughUpdates/NotEnoughUpdates-REPO/master/items/${internalId.toLowerCase()}.png`;
}

export function parseNeuDisplay(
  raw: Record<string, unknown> | null | undefined,
  internalId: string,
): ItemDisplayData {
  if (!raw) {
    return {
      coloredName: null,
      loreLines: [],
      minecraftItemId: null,
      iconUrl: null,
    };
  }

  const coloredName =
    typeof raw.displayname === "string" ? raw.displayname : null;
  const loreLines = Array.isArray(raw.lore)
    ? raw.lore.filter((line): line is string => typeof line === "string")
    : [];
  const minecraftItemId =
    typeof raw.itemid === "string" ? raw.itemid : null;
  const iconUrl = resolveItemIconUrl(raw, internalId);

  return { coloredName, loreLines, minecraftItemId, iconUrl };
}
