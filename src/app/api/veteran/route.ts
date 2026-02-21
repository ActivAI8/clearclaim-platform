import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: veterans } = await supabase
    .from("veterans")
    .select("id, first_name, last_name, email, branch_of_service")
    .order("last_name");

  return NextResponse.json({ veterans: veterans || [] });
}
