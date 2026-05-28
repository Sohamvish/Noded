import { NextResponse } from "next/server";
import { parseBooleanParam } from "@/lib/api/query";
import { buildGraphFromSubgraphRows } from "@/lib/graph/build-graph";
import { graphToReactFlow } from "@/lib/graph/to-react-flow";
import type { ReactFlowGraphPayload } from "@/lib/graph/types";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get("target")?.trim().toUpperCase() ?? "";
  const expandBases = parseBooleanParam(searchParams.get("expandBases"), false);

  if (!target) {
    return NextResponse.json(
      { error: "Missing required query parameter: target" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: targetRow, error: targetError } = await supabase
    .from("items")
    .select("internal_id")
    .eq("internal_id", target)
    .maybeSingle();

  if (targetError) {
    console.error("[api/graph] target lookup", targetError);
    return NextResponse.json(
      { error: "Failed to resolve target item." },
      { status: 500 },
    );
  }

  if (!targetRow) {
    return NextResponse.json(
      { error: `Item not found: ${target}` },
      { status: 404 },
    );
  }

  const { data: rows, error: rpcError } = await supabase.rpc(
    "get_dependency_subgraph",
    {
      target_internal_id: target,
      expand_bases: expandBases,
    },
  );

  if (rpcError) {
    console.error("[api/graph] rpc", rpcError);
    return NextResponse.json(
      { error: "Failed to load dependency subgraph." },
      { status: 500 },
    );
  }

  const subgraphRows = rows ?? [];
  const internalIds = new Set<string>([target]);

  for (const row of subgraphRows) {
    internalIds.add(row.result_internal_id);
    if (row.ingredient_internal_id) {
      internalIds.add(row.ingredient_internal_id);
    }
  }

  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("internal_id, display_name, tier")
    .in("internal_id", [...internalIds]);

  if (itemsError) {
    console.error("[api/graph] items", itemsError);
    return NextResponse.json(
      { error: "Failed to load item metadata." },
      { status: 500 },
    );
  }

  const itemMeta = new Map<
    string,
    { displayName: string; tier: string | null }
  >();

  for (const item of items ?? []) {
    itemMeta.set(item.internal_id, {
      displayName: item.display_name,
      tier: item.tier,
    });
  }

  const { nodes, edges } = buildGraphFromSubgraphRows(
    subgraphRows,
    target,
    expandBases,
    itemMeta,
  );

  const meta = {
    targetInternalId: target,
    expandBases,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };

  const body: ReactFlowGraphPayload = graphToReactFlow(nodes, edges, meta);

  return NextResponse.json(body);
}
