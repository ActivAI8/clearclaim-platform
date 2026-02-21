import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ veteranId: string }> }
) {
  const { veteranId } = await params;
  const supabase = await createClient();

  // Get veteran info
  const { data: veteran, error: vetError } = await supabase
    .from("veterans")
    .select("*")
    .eq("id", veteranId)
    .single();

  if (vetError || !veteran) {
    return NextResponse.json({ error: "Veteran not found" }, { status: 404 });
  }

  // Get cases for this veteran
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .eq("veteran_id", veteranId)
    .order("created_at", { ascending: false });

  // Get conditions for all cases
  const caseIds = (cases || []).map((c) => c.id);
  const { data: conditions } = await supabase
    .from("conditions")
    .select("*")
    .in("case_id", caseIds.length > 0 ? caseIds : ["none"]);

  // Get tasks for this veteran
  const { data: tasks } = await supabase
    .from("veteran_tasks")
    .select("*")
    .eq("veteran_id", veteranId)
    .order("due_date", { ascending: true });

  // Get evidence gaps for cases
  const { data: gaps } = await supabase
    .from("evidence_gaps")
    .select("*")
    .in("case_id", caseIds.length > 0 ? caseIds : ["none"]);

  // Get documents for cases
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .in("case_id", caseIds.length > 0 ? caseIds : ["none"])
    .order("created_at", { ascending: false });

  return NextResponse.json({
    veteran,
    cases: cases || [],
    conditions: conditions || [],
    tasks: tasks || [],
    gaps: gaps || [],
    documents: documents || [],
  });
}
