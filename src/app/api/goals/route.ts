import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/get-user";
import { MAX_PINNED_GOALS } from "@/lib/dashboard/constants";
import type { GoalItem, GoalsApiResponse } from "@/lib/items/types";

const MAX_GOALS = MAX_PINNED_GOALS;

async function mapGoalRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Array<{ id: string; internal_id: string; sort_order: number }>,
): Promise<GoalItem[]> {
  if (rows.length === 0) return [];

  const internalIds = rows.map((row) => row.internal_id);
  const { data: itemRows, error } = await supabase
    .from("items")
    .select("internal_id, display_name, tier")
    .in("internal_id", internalIds);

  if (error) {
    console.error("[api/goals] item metadata", error);
    throw new Error("Failed to load goal item metadata.");
  }

  const metaById = new Map(
    (itemRows ?? []).map((row) => [
      row.internal_id,
      { displayName: row.display_name, tier: row.tier },
    ]),
  );

  return rows.flatMap((row) => {
    const meta = metaById.get(row.internal_id);
    if (!meta) return [];

    return [
      {
        id: row.id,
        internalId: row.internal_id,
        displayName: meta.displayName,
        tier: meta.tier,
        sortOrder: row.sort_order,
      },
    ];
  });
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_goals")
    .select("id, internal_id, sort_order")
    .eq("user_id", user.id)
    .order("sort_order");

  if (error) {
    console.error("[api/goals] GET", error);
    return NextResponse.json(
      { error: "Failed to load pinned goals." },
      { status: 500 },
    );
  }

  try {
    const goals = await mapGoalRows(supabase, data ?? []);
    const body: GoalsApiResponse = { goals, maxGoals: MAX_GOALS };
    return NextResponse.json(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load goals." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { internalId?: string } = {};
  try {
    body = (await request.json()) as { internalId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const internalId = body.internalId?.trim().toUpperCase() ?? "";
  if (!internalId) {
    return NextResponse.json(
      { error: "internalId is required." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { count, error: countError } = await supabase
    .from("user_goals")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (countError) {
    console.error("[api/goals] count", countError);
    return NextResponse.json(
      { error: "Failed to check goal limit." },
      { status: 500 },
    );
  }

  if ((count ?? 0) >= MAX_GOALS) {
    return NextResponse.json(
      { error: `You can pin at most ${MAX_GOALS} goals.` },
      { status: 409 },
    );
  }

  const { data: existing } = await supabase
    .from("user_goals")
    .select("id")
    .eq("user_id", user.id)
    .eq("internal_id", internalId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "This item is already pinned." },
      { status: 409 },
    );
  }

  const { data: itemRow, error: itemError } = await supabase
    .from("items")
    .select("internal_id")
    .eq("internal_id", internalId)
    .maybeSingle();

  if (itemError || !itemRow) {
    return NextResponse.json(
      { error: `Item not found: ${internalId}` },
      { status: 404 },
    );
  }

  const sortOrder = count ?? 0;

  const { data: inserted, error: insertError } = await supabase
    .from("user_goals")
    .insert({
      user_id: user.id,
      internal_id: internalId,
      sort_order: sortOrder,
    })
    .select("id, internal_id, sort_order")
    .single();

  if (insertError || !inserted) {
    console.error("[api/goals] insert", insertError);
    return NextResponse.json(
      { error: "Failed to pin goal." },
      { status: 500 },
    );
  }

  try {
    const goals = await mapGoalRows(supabase, [inserted]);
    const goal = goals[0];
    if (!goal) {
      return NextResponse.json(
        { error: "Failed to load pinned goal." },
        { status: 500 },
      );
    }
    return NextResponse.json({ goal, maxGoals: MAX_GOALS }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to pin goal." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("id")?.trim();

  if (!goalId) {
    return NextResponse.json({ error: "Goal id is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("user_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", user.id);

  if (error) {
    console.error("[api/goals] DELETE", error);
    return NextResponse.json(
      { error: "Failed to remove goal." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
