import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchBrowseSkills } from "@/lib/browse/queries";
import type { BrowseSkillsResponse } from "@/lib/browse/types";

export async function GET() {
  const supabase = await createClient();

  try {
    const skills = await fetchBrowseSkills(supabase);
    const body: BrowseSkillsResponse = { skills };
    return NextResponse.json(body);
  } catch (error) {
    console.error("[api/browse/skills]", error);
    return NextResponse.json(
      { error: "Failed to load browse skills." },
      { status: 500 },
    );
  }
}
