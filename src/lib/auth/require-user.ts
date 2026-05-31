import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/get-user";
import type { User } from "@supabase/supabase-js";

export async function requireAuthUser(): Promise<
  { user: User } | { response: NextResponse }
> {
  const user = await getAuthUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user };
}
