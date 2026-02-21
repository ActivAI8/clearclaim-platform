import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import VeteranPortalClient from "./client";

export default async function VeteranPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Staff users should go to the staff dashboard
  const role = user.user_metadata?.role;
  if (role === "staff" || role === "admin") redirect("/staff");

  // Get veteran record linked to this auth user
  const { data: veteran } = await supabase
    .from("veterans")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!veteran) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">No Veteran Record Found</h1>
          <p className="text-gray-500 mt-2">Your account is not linked to a veteran record. Please contact your VSO.</p>
        </div>
      </div>
    );
  }

  // Get cases for this veteran
  const { data: cases } = await supabase
    .from("cases")
    .select("*, site:sites(name)")
    .eq("veteran_id", veteran.id)
    .order("created_at", { ascending: false });

  // Get conditions for all cases
  const caseIds = (cases || []).map((c) => c.id);
  const { data: conditions } = caseIds.length
    ? await supabase.from("conditions").select("*").in("case_id", caseIds)
    : { data: [] };

  // Get tasks for this veteran
  const { data: tasks } = await supabase
    .from("veteran_tasks")
    .select("*")
    .eq("veteran_id", veteran.id)
    .order("due_date", { ascending: true });

  // Get documents for all cases
  const { data: documents } = caseIds.length
    ? await supabase.from("documents").select("*").in("case_id", caseIds).order("created_at", { ascending: false })
    : { data: [] };

  // Get evidence gaps
  const { data: gaps } = caseIds.length
    ? await supabase.from("evidence_gaps").select("*").in("case_id", caseIds)
    : { data: [] };

  // Get messages
  const { data: caseMessages } = caseIds.length
    ? await supabase.from("case_messages").select("*").in("case_id", caseIds).order("created_at")
    : { data: [] };

  return (
    <VeteranPortalClient
      user={user}
      veteran={veteran}
      cases={cases || []}
      conditions={conditions || []}
      tasks={tasks || []}
      documents={documents || []}
      gaps={gaps || []}
      caseMessages={caseMessages || []}
    />
  );
}
