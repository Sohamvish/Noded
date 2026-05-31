import { gunzipSync, inflateSync } from "node:zlib";

/** Hypixel API inventory blob: base64 gzip-compressed NBT. */
export interface HypixelInventoryBlob {
  type?: number;
  data: string;
}

export interface InventoryParseResult {
  internalIds: string[];
  parsedSources: string[];
  errors: Array<{ source: string; message: string }>;
  blobsFound: number;
}

const INVENTORY_LEAF_KEYS = new Set([
  "inv_contents",
  "inv_armor",
  "ender_chest_contents",
  "enderchest_contents",
  "equipment_contents",
  "wardrobe_contents",
  "wardrobe_equipped",
  "personal_vault_contents",
  "backpack_icon",
]);

const NESTED_BAG_KEYS = new Set(["backpack_contents", "bag_contents"]);

/** Normalize API value to a blob or null if not inventory data. */
export function normalizeInventoryBlob(value: unknown): HypixelInventoryBlob | null {
  if (typeof value === "string" && value.length > 0) {
    return { data: value };
  }

  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.data !== "string" || record.data.length === 0) return null;

  return {
    data: record.data,
    type: typeof record.type === "number" ? record.type : undefined,
  };
}

/** Collect all inventory NBT blobs from a profile member object. */
export function listInventoryBlobSources(
  member: Record<string, unknown>,
): Array<{ source: string; blob: HypixelInventoryBlob }> {
  const out: Array<{ source: string; blob: HypixelInventoryBlob }> = [];
  const seenData = new Set<string>();

  const add = (source: string, value: unknown) => {
    const blob = normalizeInventoryBlob(value);
    if (!blob || seenData.has(blob.data)) return;
    seenData.add(blob.data);
    out.push({ source, blob });
  };

  const inventory = member.inventory;
  if (inventory && typeof inventory === "object") {
    for (const [key, value] of Object.entries(inventory)) {
      if (NESTED_BAG_KEYS.has(key) && value && typeof value === "object") {
        for (const [bagKey, bagValue] of Object.entries(
          value as Record<string, unknown>,
        )) {
          add(`inventory.${key}.${bagKey}`, bagValue);
        }
        continue;
      }
      if (INVENTORY_LEAF_KEYS.has(key) || key.endsWith("_contents")) {
        add(`inventory.${key}`, value);
      }
    }
  }

  for (const key of INVENTORY_LEAF_KEYS) {
    add(key, member[key]);
  }

  return out;
}

/** Decode base64 Hypixel blob to raw NBT bytes. */
export function decodeHypixelInventoryBytes(
  blob: HypixelInventoryBlob,
): Buffer {
  let buffer = Buffer.from(blob.data, "base64");

  if (buffer.length === 0) {
    return buffer;
  }

  // type 0 (default): gzip. Some payloads use raw deflate.
  const compression = blob.type ?? 0;

  if (compression === 0) {
    try {
      return gunzipSync(buffer);
    } catch {
      try {
        return inflateSync(buffer);
      } catch {
        return buffer;
      }
    }
  }

  if (compression === 1) {
    try {
      return inflateSync(buffer);
    } catch {
      return buffer;
    }
  }

  return buffer;
}

function petInternalIdFromExtraAttributes(
  extraAttributes: Record<string, unknown>,
): string | null {
  if (typeof extraAttributes.petInfo !== "string") return null;

  try {
    const pet = JSON.parse(extraAttributes.petInfo) as { type?: string };
    if (!pet.type) return null;
    return `${pet.type}_PET`.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Walk simplified NBT and collect Skyblock internal_ids from ExtraAttributes.
 * Exported for unit tests.
 */
export function collectExtraAttributeIds(
  node: unknown,
  out: Set<string> = new Set(),
): Set<string> {
  if (node === null || node === undefined) return out;

  if (Array.isArray(node)) {
    for (const item of node) collectExtraAttributeIds(item, out);
    return out;
  }

  if (typeof node !== "object") return out;

  const record = node as Record<string, unknown>;
  const extraAttributes = record.ExtraAttributes;

  if (extraAttributes && typeof extraAttributes === "object") {
    const ea = extraAttributes as Record<string, unknown>;
    const rawId = ea.id;
    if (typeof rawId === "string" && rawId.length > 0) {
      const normalized = rawId.toUpperCase();
      if (normalized !== "PET") {
        out.add(normalized);
      }
      const petId = petInternalIdFromExtraAttributes(ea);
      if (petId) out.add(petId);
      else if (normalized === "PET") {
        out.add(normalized);
      }
    }
  }

  for (const value of Object.values(record)) {
    collectExtraAttributeIds(value, out);
  }

  return out;
}

export async function parseInventoryBlob(
  blob: HypixelInventoryBlob,
): Promise<string[]> {
  const bytes = decodeHypixelInventoryBytes(blob);
  if (bytes.length === 0) return [];

  const nbt = await import("prismarine-nbt");
  const { parsed } = await nbt.parse(bytes);
  const simplified = nbt.simplify(parsed);
  return [...collectExtraAttributeIds(simplified)];
}

export async function parseInventoryFromMember(
  member: Record<string, unknown>,
): Promise<InventoryParseResult> {
  const sources = listInventoryBlobSources(member);
  const ids = new Set<string>();
  const parsedSources: string[] = [];
  const errors: Array<{ source: string; message: string }> = [];

  for (const { source, blob } of sources) {
    try {
      const found = await parseInventoryBlob(blob);
      if (found.length > 0) {
        parsedSources.push(source);
      }
      for (const id of found) ids.add(id);
    } catch (err) {
      errors.push({
        source,
        message: err instanceof Error ? err.message : "Failed to parse NBT",
      });
    }
  }

  return {
    internalIds: [...ids],
    parsedSources,
    errors,
    blobsFound: sources.length,
  };
}

/** Union manual completions with inventory-derived internal_ids. */
export function mergeCompletedItems(
  existing: string[] | null | undefined,
  discovered: string[],
): string[] {
  const merged = new Set<string>();

  for (const id of existing ?? []) {
    if (id) merged.add(id.toUpperCase());
  }
  for (const id of discovered) {
    if (id) merged.add(id.toUpperCase());
  }

  return [...merged].sort();
}
