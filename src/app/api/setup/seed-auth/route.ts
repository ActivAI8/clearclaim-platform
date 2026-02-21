import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// This route seeds demo auth users. Run once during setup.
// Uses service_role key to create users directly.
export async function POST() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const orgId = "a0000000-0000-0000-0000-000000000001";
  const siteIds = {
    austin: "b0000000-0000-0000-0000-000000000001",
    houston: "b0000000-0000-0000-0000-000000000002",
    dallas: "b0000000-0000-0000-0000-000000000003",
  };

  // Demo staff accounts
  const staffAccounts = [
    {
      email: "admin@clearclaim.demo",
      password: "demo1234",
      full_name: "Sarah Chen",
      role: "org_admin",
      site_id: null,
      can_access_all_sites: true,
    },
    {
      email: "caseworker@clearclaim.demo",
      password: "demo1234",
      full_name: "Marcus Thompson",
      role: "caseworker",
      site_id: siteIds.austin,
      can_access_all_sites: false,
    },
    {
      email: "supervisor@clearclaim.demo",
      password: "demo1234",
      full_name: "Lisa Rodriguez",
      role: "supervisor",
      site_id: siteIds.austin,
      can_access_all_sites: false,
    },
  ];

  // Demo veteran accounts (linked to existing veteran records)
  const veteranAccounts = [
    {
      email: "maria.garcia@veteran.demo",
      password: "demo1234",
      full_name: "Maria Garcia",
      veteran_id: "c0000000-0000-0000-0000-000000000006",
    },
    {
      email: "robert.johnson@veteran.demo",
      password: "demo1234",
      full_name: "Robert Johnson",
      veteran_id: "c0000000-0000-0000-0000-000000000005",
    },
    {
      email: "james.mitchell@veteran.demo",
      password: "demo1234",
      full_name: "James Mitchell",
      veteran_id: "c0000000-0000-0000-0000-000000000001",
    },
  ];

  const results: Array<{ email: string; status: string; error?: string }> = [];

  // Create staff users
  for (const staff of staffAccounts) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: staff.email,
      password: staff.password,
      email_confirm: true,
      user_metadata: { full_name: staff.full_name, role: staff.role },
    });

    if (authError) {
      // User might already exist
      if (authError.message.includes("already been registered")) {
        results.push({ email: staff.email, status: "already_exists" });
        continue;
      }
      results.push({ email: staff.email, status: "error", error: authError.message });
      continue;
    }

    // Upsert user_profiles linking to auth user
    const { error: profileError } = await supabase.from("user_profiles").upsert({
      id: authData.user.id,
      organization_id: orgId,
      site_id: staff.site_id,
      role: staff.role,
      full_name: staff.full_name,
      email: staff.email,
      is_active: true,
      can_access_all_sites: staff.can_access_all_sites,
    }, { onConflict: "id" });

    results.push({
      email: staff.email,
      status: profileError ? "auth_ok_profile_error" : "created",
      error: profileError?.message,
    });
  }

  // Create veteran users
  for (const vet of veteranAccounts) {
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: vet.email,
      password: vet.password,
      email_confirm: true,
      user_metadata: { full_name: vet.full_name, role: "veteran" },
    });

    let userId: string;

    if (authError) {
      if (authError.message.includes("already been registered")) {
        // User exists — look up their ID so we can still link veteran record + profile
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find((u) => u.email === vet.email);
        if (!existing) {
          results.push({ email: vet.email, status: "error", error: "exists but could not find user id" });
          continue;
        }
        userId = existing.id;
      } else {
        results.push({ email: vet.email, status: "error", error: authError.message });
        continue;
      }
    } else {
      userId = authData.user.id;
    }

    // Link veteran record to auth user
    const { error: vetError } = await supabase
      .from("veterans")
      .update({ user_id: userId })
      .eq("id", vet.veteran_id);

    // Also create a user_profiles entry for the veteran
    const { error: profileError } = await supabase.from("user_profiles").upsert({
      id: userId,
      organization_id: orgId,
      role: "veteran",
      full_name: vet.full_name,
      email: vet.email,
      is_active: true,
      can_access_all_sites: false,
    }, { onConflict: "id" });

    results.push({
      email: vet.email,
      status: vetError || profileError ? "partial" : authError ? "re-linked" : "created",
      error: vetError?.message || profileError?.message,
    });
  }

  return NextResponse.json({ results });
}
