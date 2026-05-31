import { NextResponse } from "next/server";
import { escapePostgrestFilter, parsePositiveInt } from "@/lib/api/query";
import { createClient } from "@/lib/supabase/server";
import type { ItemSearchApiResponse, ItemSearchResult } from "@/lib/items/types";

function rankResults(query: string, items: ItemSearchResult[]): ItemSearchResult[] {
  const q = query.toLowerCase();
  const qUpper = query.toUpperCase();

  return [...items].sort((a, b) => {
    const score = (item: ItemSearchResult) => {
      const id = item.internalId;
      const name = item.displayName.toLowerCase();

      if (id === qUpper) return 0;
      if (id.startsWith(qUpper)) return 1;
      if (name === q) return 2;
      if (name.startsWith(q)) return 3;
      if (id.includes(qUpper)) return 4;
      if (name.includes(q)) return 5;
      return 6;
    };

    const diff = score(a) - score(b);
    if (diff !== 0) return diff;
    return a.displayName.localeCompare(b.displayName);
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "Query must be at least 2 characters." },
      { status: 400 },
    );
  }

  const limit = parsePositiveInt(searchParams.get("limit"), 20, 50);
  const escaped = escapePostgrestFilter(query);
  const pattern = `%${escaped}%`;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("items")
    .select("internal_id, display_name, tier, category")
    .or(
      `internal_id.ilike.${pattern},display_name.ilike.${pattern}`,
    )
    .limit(limit * 3);

  if (error) {
    console.error("[api/items/search]", error);
    return NextResponse.json(
      { error: "Failed to search items." },
      { status: 500 },
    );
  }

  const mapped: ItemSearchResult[] = (data ?? []).map((row) => ({
    internalId: row.internal_id,
    displayName: row.display_name,
    tier: row.tier,
    category: row.category,
  }));

  const results = rankResults(query, mapped).slice(0, limit);

  const body: ItemSearchApiResponse = { results, query };
  return NextResponse.json(body);
}
