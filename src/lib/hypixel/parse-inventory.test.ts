import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  collectExtraAttributeIds,
  listInventoryBlobSources,
  mergeCompletedItems,
  normalizeInventoryBlob,
} from "./parse-inventory";

describe("normalizeInventoryBlob", () => {
  it("accepts raw base64 strings", () => {
    assert.deepEqual(normalizeInventoryBlob("abc123"), { data: "abc123" });
  });

  it("accepts typed API objects", () => {
    assert.deepEqual(normalizeInventoryBlob({ type: 0, data: "abc123" }), {
      type: 0,
      data: "abc123",
    });
  });

  it("rejects empty or invalid values", () => {
    assert.equal(normalizeInventoryBlob(""), null);
    assert.equal(normalizeInventoryBlob({ type: 0 }), null);
    assert.equal(normalizeInventoryBlob(null), null);
  });
});

describe("listInventoryBlobSources", () => {
  it("collects nested inventory and top-level blobs", () => {
    const member = {
      inventory: {
        inv_contents: { type: 0, data: "inv" },
        ender_chest_contents: { type: 0, data: "ec" },
        backpack_contents: {
          bag_0: { type: 0, data: "bag" },
        },
      },
      inv_armor: { type: 0, data: "armor" },
    };

    const sources = listInventoryBlobSources(member);
    assert.equal(sources.length, 4);
    assert.ok(sources.some((s) => s.source === "inventory.inv_contents"));
    assert.ok(sources.some((s) => s.source === "inventory.backpack_contents.bag_0"));
    assert.ok(sources.some((s) => s.source === "inv_armor"));
  });

  it("deduplicates identical blob data", () => {
    const member = {
      inventory: { inv_contents: { data: "same" } },
      inv_contents: { data: "same" },
    };
    assert.equal(listInventoryBlobSources(member).length, 1);
  });
});

describe("collectExtraAttributeIds", () => {
  it("extracts ExtraAttributes.id from nested items", () => {
    const tree = {
      i: [
        { tag: { ExtraAttributes: { id: "HYPERION" } } },
        { tag: { ExtraAttributes: { id: "ASPECT_OF_THE_END" } } },
      ],
    };

    const ids = [...collectExtraAttributeIds(tree)].sort();
    assert.deepEqual(ids, ["ASPECT_OF_THE_END", "HYPERION"]);
  });

  it("maps PET items via petInfo to TYPE_PET ids", () => {
    const tree = {
      tag: {
        ExtraAttributes: {
          id: "PET",
          petInfo: JSON.stringify({ type: "ELEPHANT", tier: "LEGENDARY" }),
        },
      },
    };

    const ids = [...collectExtraAttributeIds(tree)];
    assert.ok(ids.includes("ELEPHANT_PET"));
    assert.ok(!ids.includes("PET"));
  });
});

describe("mergeCompletedItems", () => {
  it("unions existing and discovered ids case-insensitively", () => {
    const merged = mergeCompletedItems(
      ["hyperion", "ASPECT_OF_THE_END"],
      ["Hyperion", "VALKYRIE"],
    );
    assert.deepEqual(merged, ["ASPECT_OF_THE_END", "HYPERION", "VALKYRIE"]);
  });

  it("handles null existing list", () => {
    assert.deepEqual(mergeCompletedItems(null, ["A", "B"]), ["A", "B"]);
  });
});
