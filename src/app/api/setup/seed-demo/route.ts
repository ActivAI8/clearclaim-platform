import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const orgId = "a0000000-0000-0000-0000-000000000001";

    // Auth user UUIDs — these are fixed and already exist in auth.users
    const AUTH_JAMES  = "e983ff27-7271-4b15-9193-91592d34ac3d"; // james.mitchell@veteran.demo
    const AUTH_ROBERT = "59a42f1f-c448-4601-8223-5d2ae0faac7f"; // robert.johnson@veteran.demo
    const AUTH_MARIA  = "a3e14b7a-8e09-4593-b618-136361074b69"; // maria.garcia@veteran.demo

    const { data: site } = await supabase.from("sites").select("id").eq("slug", "houston").single();
    if (!site) throw new Error("Houston site not found");
    const siteId = site.id;

    // ── CLEAN ALL PRIOR DEMO DATA ──────────────────────────────────────────────
    await supabase.from("case_messages").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("evidence_gaps").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("evidence_snippets").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("veteran_tasks").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("documents").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("conditions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("intake_responses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("cases").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("veterans").delete().ilike("email", "%.demo");

    // ── VETERAN 1: SGT JAMES MITCHELL (auth: james.mitchell@veteran.demo) ──────
    const { data: v1 } = await supabase.from("veterans").insert({
      user_id: AUTH_JAMES,
      organization_id: orgId,
      first_name: "James",
      last_name: "Mitchell",
      email: "james.mitchell@veteran.demo",
      phone: "(713) 555-0101",
      date_of_birth: "1989-04-12",
      branch_of_service: "Army",
      service_start_date: "2010-06-15",
      service_end_date: "2018-06-15",
      discharge_status: "Honorable",
      va_file_number: "23-456-789",
      ssn_last_four: "4821",
      address: { street: "2204 Veterans Blvd", city: "Houston", state: "TX", zip: "77001" },
    }).select().single();
    if (!v1) throw new Error("Failed to create James Mitchell");

    const { data: c1 } = await supabase.from("cases").insert({
      organization_id: orgId,
      site_id: siteId,
      veteran_id: v1.id,
      case_number: "CC-2026-0001",
      status: "review",
      priority: "urgent",
      packet_readiness_score: 85,
      intake_completeness: 100,
      citation_coverage: 70,
      sla_due_at: new Date(Date.now() + 2 * 86400000).toISOString(),
      notes: "Veteran served as 11B Infantry. Two OIF/OEF deployments. IED blast exposure documented. Fast-track for PTSD.",
    }).select().single();
    if (!c1) throw new Error("Failed to create James case");

    const { data: jConds } = await supabase.from("conditions").insert([
      {
        case_id: c1.id,
        name: "Post-Traumatic Stress Disorder (PTSD)",
        icd_code: "F43.10",
        status: "approved",
        confidence: 0.95,
        onset_date: "2014-09-01",
        onset_description: "Onset following IED blast and loss of two squad members during Kandahar deployment, September 2014.",
        symptoms: ["Nightmares", "Hypervigilance", "Avoidance", "Flashbacks", "Sleep disturbance", "Emotional numbing"],
        functional_impact: "Unable to work in crowded environments. Avoids public transportation. Difficulty maintaining employment. Reports weekly panic attacks.",
        current_severity: "severe",
        treatments: ["CBT therapy", "Prazosin 2mg", "Sertraline 100mg", "VA Mental Health group sessions"],
        ai_summary: "Veteran documents persistent PTSD symptoms following direct combat trauma during OEF deployment. Strong service nexus established via SMRs showing traumatic event on 09/14/2014 and subsequent mental health referral. C&P exam recommended to substantiate 70% rating.",
        conflict_flags: [],
      },
      {
        case_id: c1.id,
        name: "Degenerative Disc Disease, Lumbar Spine (L4-L5, L5-S1)",
        icd_code: "M47.816",
        status: "approved",
        confidence: 0.88,
        onset_date: "2015-03-20",
        onset_description: "Progressive low back pain following repeated heavy load-bearing duties and vehicle accident during service.",
        symptoms: ["Chronic lower back pain", "Radiating pain to left leg", "Limited range of motion", "Morning stiffness"],
        functional_impact: "Cannot stand for more than 20 minutes. Cannot lift more than 10 pounds. Sleep interrupted by pain nightly.",
        current_severity: "moderate",
        treatments: ["Meloxicam 15mg", "Physical therapy (12 sessions)", "Epidural steroid injection (2023)", "Heating pad / TENS unit"],
        ai_summary: "X-rays and MRI confirm L4-L5 and L5-S1 disc degeneration with foraminal narrowing. Service records document multiple back injury incidents during training exercises. In-service nexus is strong.",
        conflict_flags: [],
      },
      {
        case_id: c1.id,
        name: "Mild Traumatic Brain Injury (mTBI) with Residuals",
        icd_code: "S09.90XA",
        status: "draft",
        confidence: 0.75,
        onset_date: "2014-09-01",
        onset_description: "LOC documented following IED blast 09/14/2014. Post-concussive symptoms persist.",
        symptoms: ["Headaches", "Memory lapses", "Light sensitivity", "Irritability"],
        functional_impact: "Chronic headaches 4-5x per week. Difficulty concentrating. Light sensitivity affecting daily activities.",
        current_severity: "moderate",
        treatments: ["Topiramate 50mg", "Neuropsychological testing (2022)", "VA TBI screening positive"],
        ai_summary: "SMRs document LOC and post-concussive evaluation following blast injury. Neuropsychological testing supports persistent residuals. Recommend secondary to PTSD nexus or direct service connection through blast event.",
        conflict_flags: [],
      },
    ]).select();

    await supabase.from("documents").insert([
      {
        case_id: c1.id,
        file_name: "DD214_Mitchell_James.pdf",
        file_path: `demo/${c1.id}/dd214_james_mitchell.pdf`,
        file_size: 245000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 4,
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: "DD Form 214 — Certificate of Release or Discharge from Active Duty. Name: Mitchell, James A. Service: US Army. Period: 15 JUN 2010 – 15 JUN 2018. Characterization: Honorable. MOS: 11B Infantryman. Deployments: OIF (2012), OEF (2014-2015). Awards: Combat Infantryman Badge, Army Commendation Medal, Purple Heart.",
        metadata: { ai_analysis: { conditions_found: 0, snippets_extracted: 3 } },
      },
      {
        case_id: c1.id,
        file_name: "ServiceTreatmentRecords_Mitchell.pdf",
        file_path: `demo/${c1.id}/str_james_mitchell.pdf`,
        file_size: 1840000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 42,
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: "Military Treatment Facility Records — Patient: Mitchell, James A. Dates: 2010–2018. Notes include: Back injury reported 03/2015 after training exercise with 80lb ruck. LOC documented 09/14/2014 following IED blast, Kandahar Province. Mental health referral initiated 11/2014. Diagnosis: Adjustment disorder with anxious mood. Referred to behavioral health.",
        metadata: { ai_analysis: { conditions_found: 3, snippets_extracted: 14 } },
      },
      {
        case_id: c1.id,
        file_name: "VAMedicalRecords_2019-2025_Mitchell.pdf",
        file_path: `demo/${c1.id}/va_records_james.pdf`,
        file_size: 3200000,
        mime_type: "application/pdf",
        category: "va_notes",
        page_count: 88,
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: "VA Medical Center Records — Houston VAMC. Patient: James Mitchell. Diagnoses: PTSD (F43.10), DDD Lumbar Spine (M47.816), mTBI residuals. Active medications: Sertraline 100mg, Prazosin 2mg, Meloxicam 15mg, Topiramate 50mg. Mental health treatment ongoing since 2019. GAF Score: 45.",
        metadata: { ai_analysis: { conditions_found: 3, snippets_extracted: 22 } },
      },
      {
        case_id: c1.id,
        file_name: "Personal_Statement_Mitchell_2026.pdf",
        file_path: `demo/${c1.id}/personal_statement_james.pdf`,
        file_size: 48000,
        mime_type: "application/pdf",
        category: "personal_statement",
        page_count: 3,
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: "PERSONAL STATEMENT — James A. Mitchell, SSN xxxx-4821\n\nI am submitting this statement in support of my VA disability claim. On September 14, 2014, my unit struck an IED in Kandahar Province, Afghanistan. I was rendered unconscious and lost two of my closest brothers. Since returning from deployment I have struggled with constant nightmares, an inability to be in crowds, and severe back pain that limits every part of my daily life. I cannot hold steady employment. My marriage suffered greatly. I am requesting the VA consider the full impact these service-connected conditions have had on my life.",
        metadata: { ai_analysis: { conditions_found: 2, snippets_extracted: 8 } },
      },
    ]);

    const jCond1 = jConds?.[0];
    const jCond2 = jConds?.[1];
    const jCond3 = jConds?.[2];

    await supabase.from("evidence_gaps").insert([
      { case_id: c1.id, condition_id: jCond1?.id || null, category_name: "Nexus Letter (PTSD)", gap_status: "missing", description: "Requires signed nexus letter from treating psychiatrist linking PTSD to IED blast event on 09/14/2014." },
      { case_id: c1.id, condition_id: jCond3?.id || null, category_name: "Neuropsychological Evaluation", gap_status: "missing", description: "Full neuropsych eval report required to substantiate mTBI residuals at a compensable level." },
      { case_id: c1.id, condition_id: jCond2?.id || null, category_name: "Buddy Statement", gap_status: "supported", description: "Buddy statement from fellow soldier corroborating back injury incident obtained." },
      { case_id: c1.id, condition_id: jCond1?.id || null, category_name: "C&P Exam Results", gap_status: "supported", description: "DBQ completed by VA examiner. PTSD confirmed, GAF noted." },
    ]);

    await supabase.from("veteran_tasks").insert([
      { case_id: c1.id, veteran_id: v1.id, task_type: "upload", title: "Upload DD-214", description: "Your DD-214 discharge document is required to verify service dates and character of discharge.", status: "completed", completed_at: new Date(Date.now() - 10 * 86400000).toISOString() },
      { case_id: c1.id, veteran_id: v1.id, task_type: "upload", title: "Upload Service Treatment Records", description: "Military medical records documenting treatment during active service.", status: "completed", completed_at: new Date(Date.now() - 7 * 86400000).toISOString() },
      { case_id: c1.id, veteran_id: v1.id, task_type: "provide_statement", title: "Write Personal Statement", description: "Describe how your conditions began during service and impact your daily life.", status: "completed", completed_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { case_id: c1.id, veteran_id: v1.id, task_type: "upload", title: "Upload Nexus Letter from Treating Psychiatrist", description: "Your psychiatrist must provide a written opinion linking your PTSD to the IED blast event documented in your service records.", status: "sent", due_date: new Date(Date.now() + 5 * 86400000).toISOString() },
      { case_id: c1.id, veteran_id: v1.id, task_type: "upload", title: "Upload Neuropsychological Evaluation", description: "Full neuropsych testing report to substantiate mTBI residuals.", status: "sent", due_date: new Date(Date.now() + 10 * 86400000).toISOString() },
    ]);

    await supabase.from("case_messages").insert([
      { case_id: c1.id, sender_id: "00000000-0000-0000-0000-000000000001", sender_type: "staff", sender_name: "ClearClaim AI", content: "Welcome to ClearClaim, James. Your case has been created and assigned to the Houston VSO office. Your VSO specialist will review your case within 24 hours.", created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: v1.id, sender_type: "veteran", sender_name: "James Mitchell", content: "Hi, I've uploaded all my medical records and my DD-214. I wasn't sure whether to include my VA records too so I uploaded those as well.", created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "Maria Santos, VSO", content: "James, thank you for uploading everything. Our AI has already reviewed your records and identified three conditions we can pursue. Your case is looking strong. The main thing we still need is a Nexus Letter from your psychiatrist. Can you ask Dr. Nguyen at the Houston VAMC to write one?", created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: v1.id, sender_type: "veteran", sender_name: "James Mitchell", content: "Yes, I have an appointment with Dr. Nguyen next Tuesday. I'll ask her then. Is there anything specific it needs to say?", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "Maria Santos, VSO", content: "The nexus letter needs to state that your PTSD is 'at least as likely as not' caused by or aggravated by your military service. I've generated a template letter below using our AI tool — you can share it directly with Dr. Nguyen to make it easy for her.\n\n[AI Nexus Letter Template is available in the AI Tools tab on your case]", created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: "00000000-0000-0000-0000-000000000001", sender_type: "staff", sender_name: "ClearClaim AI", content: "[AI Notification] Document 'ServiceTreatmentRecords_Mitchell.pdf' analyzed. Found 3 conditions and 14 evidence snippets. Task 'Upload Service Treatment Records' automatically marked complete.", created_at: new Date(Date.now() - 7 * 86400000 + 300000).toISOString() },
      { case_id: c1.id, sender_id: v1.id, sender_type: "veteran", sender_name: "James Mitchell", content: "That's really helpful. I'll bring that template to my appointment. Will the TBI be included in my claim?", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { case_id: c1.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "Maria Santos, VSO", content: "Yes — the AI flagged your TBI as a strong secondary claim to your PTSD from the same blast event. We'll pursue it once the neuropsych eval is in. Your overall packet readiness is now at 85%. You're very close.", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
    ]);

    // ── VETERAN 2: PETTY OFFICER ROBERT JOHNSON (auth: robert.johnson@veteran.demo) ──
    const { data: v2 } = await supabase.from("veterans").insert({
      user_id: AUTH_ROBERT,
      organization_id: orgId,
      first_name: "Robert",
      last_name: "Johnson",
      email: "robert.johnson@veteran.demo",
      phone: "(713) 555-0202",
      date_of_birth: "1992-07-28",
      branch_of_service: "Navy",
      service_start_date: "2012-01-10",
      service_end_date: "2020-01-10",
      discharge_status: "Honorable",
      va_file_number: "24-112-003",
      ssn_last_four: "7634",
      address: { street: "4411 Shore Drive", city: "Houston", state: "TX", zip: "77058" },
    }).select().single();
    if (!v2) throw new Error("Failed to create Robert Johnson");

    const { data: c2 } = await supabase.from("cases").insert({
      organization_id: orgId,
      site_id: siteId,
      veteran_id: v2.id,
      case_number: "CC-2026-0002",
      status: "processing",
      priority: "high",
      packet_readiness_score: 45,
      intake_completeness: 60,
      citation_coverage: 30,
      sla_due_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      notes: "MST survivor. Sensitive case — restrict access. Mental health records in transit from NAS Jacksonville.",
    }).select().single();
    if (!c2) throw new Error("Failed to create Robert case");

    const { data: sConds } = await supabase.from("conditions").insert([
      {
        case_id: c2.id,
        name: "Major Depressive Disorder (MDD), Recurrent",
        icd_code: "F33.1",
        status: "approved",
        confidence: 0.90,
        onset_date: "2016-05-01",
        onset_description: "Diagnosis of MDD following Military Sexual Trauma (MST) incident, documented May 2016.",
        symptoms: ["Persistent sadness", "Anhedonia", "Sleep disturbance", "Fatigue", "Concentration difficulty"],
        functional_impact: "Struggles to maintain employment. Social withdrawal. Dependent on support network for daily functioning.",
        current_severity: "moderate",
        treatments: ["Escitalopram 20mg", "Individual therapy (ongoing)", "VA women's mental health group"],
        ai_summary: "MST-related MDD well-documented with in-service incident report and subsequent mental health records. Direct service connection established through documented MST event and immediate referral for psychiatric care.",
        conflict_flags: [],
      },
      {
        case_id: c2.id,
        name: "Chronic Pelvic Pain Syndrome",
        icd_code: "N94.89",
        status: "draft",
        confidence: 0.72,
        onset_date: "2016-06-01",
        onset_description: "Chronic pelvic pain with onset following MST. Documented by OB/GYN at NAS Jacksonville 06/2016.",
        symptoms: ["Chronic pelvic pain", "Dysmenorrhea", "Pelvic floor dysfunction"],
        functional_impact: "Interferes with work and daily activities. Requires ongoing gynecological care.",
        current_severity: "moderate",
        treatments: ["Physical therapy (pelvic floor)", "Hormonal management", "Pain management"],
        ai_summary: "Pelvic pain secondary to MST event. Records from NAS Jacksonville confirm onset and treatment initiation in service. Strong secondary to MST or direct service connection available.",
        conflict_flags: [],
      },
      {
        case_id: c2.id,
        name: "Anxiety Disorder, Generalized (GAD)",
        icd_code: "F41.1",
        status: "draft",
        confidence: 0.68,
        onset_date: "2016-05-01",
        onset_description: "GAD diagnosed concurrently with MDD, both linked to MST trauma.",
        symptoms: ["Excessive worry", "Restlessness", "Muscle tension", "Social anxiety"],
        functional_impact: "Difficulty in workplace environments. Avoids situations that trigger memories.",
        current_severity: "mild",
        treatments: ["Buspirone 15mg", "CBT (ongoing)"],
        ai_summary: "GAD secondary to MST-related trauma. Can be claimed as secondary condition to MDD.",
        conflict_flags: [],
      },
    ]).select();

    await supabase.from("documents").insert([
      {
        case_id: c2.id,
          file_name: "DD214_Johnson_Robert.pdf",
          file_path: `demo/${c2.id}/dd214_robert_johnson.pdf`,
        file_size: 198000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 4,
        processing_status: "complete",
        processing_progress: 100,
          ocr_text: "DD Form 214 — Johnson, Robert T. Branch: US Navy. Period: 10 JAN 2012 – 10 JAN 2020. Characterization: Honorable. Rating: Hospital Corpsman (HM). Deployments: Deployed USS Bataan (2015), NAS Jacksonville (2016-2020). Awards: Navy Achievement Medal, Good Conduct Medal.",
        metadata: { ai_analysis: { conditions_found: 0, snippets_extracted: 2 } },
      },
    ]);

    const sCond1 = sConds?.[0];
    const sCond2 = sConds?.[1];

    await supabase.from("evidence_gaps").insert([
      { case_id: c2.id, condition_id: sCond1?.id || null, category_name: "MST Incident Report", gap_status: "missing", description: "Official incident documentation of MST event from NAS Jacksonville, May 2016." },
      { case_id: c2.id, condition_id: sCond1?.id || null, category_name: "In-Service Mental Health Records", gap_status: "missing", description: "Naval Health Clinic Jacksonville mental health records (2016-2020). Records request submitted — pending." },
      { case_id: c2.id, condition_id: sCond2?.id || null, category_name: "OB/GYN Treatment Records", gap_status: "missing", description: "NAS Jacksonville OB/GYN records documenting chronic pelvic pain treatment 2016-2020." },
      { case_id: c2.id, condition_id: sCond1?.id || null, category_name: "Personal Statement", gap_status: "missing", description: "Veteran has not yet submitted a personal statement describing the MST incident and ongoing impact." },
      { case_id: c2.id, condition_id: null, category_name: "Buddy Statement", gap_status: "missing", description: "Statement from fellow service member to corroborate events." },
    ]);

    await supabase.from("veteran_tasks").insert([
      { case_id: c2.id, veteran_id: v2.id, task_type: "upload", title: "Upload DD-214", description: "Certificate of Release or Discharge from Active Duty.", status: "completed", completed_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { case_id: c2.id, veteran_id: v2.id, task_type: "provide_statement", title: "Write Personal Statement", description: "Describe how your conditions relate to your military service. This is confidential and only shared with your VSO.", status: "sent", due_date: new Date(Date.now() + 7 * 86400000).toISOString() },
      { case_id: c2.id, veteran_id: v2.id, task_type: "upload", title: "Upload Post-Service Medical Records", description: "Any treatment records from civilian providers or VA since discharge in 2020.", status: "sent", due_date: new Date(Date.now() + 7 * 86400000).toISOString() },
      { case_id: c2.id, veteran_id: v2.id, task_type: "answer_questions", title: "Complete Condition Detail Questionnaire", description: "Answer specific questions about each of your three claimed conditions to help us build the strongest possible case.", status: "pending", due_date: new Date(Date.now() + 14 * 86400000).toISOString() },
    ]);

    await supabase.from("case_messages").insert([
      { case_id: c2.id, sender_id: "00000000-0000-0000-0000-000000000001", sender_type: "staff", sender_name: "ClearClaim AI", content: "Welcome to ClearClaim, Robert. Your case has been created and is assigned to the Houston VSO office. All communications are confidential.", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { case_id: c2.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "Elena Vasquez, VSO", content: "Hi Robert, I'm Elena, your VSO specialist. I've reviewed your intake form and I want you to know this is a safe space. We've identified three strong conditions to pursue. The most important next step is requesting your in-service medical records from NAS Jacksonville — I've already submitted that request on your behalf. In the meantime, can you complete the personal statement when you feel ready?", created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { case_id: c2.id, sender_id: v2.id, sender_type: "veteran", sender_name: "Robert Johnson", content: "Thank you Elena. I wasn't sure I qualified. I'll work on the personal statement this week. Is there a guide I can use?", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { case_id: c2.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "Elena Vasquez, VSO", content: "Absolutely! In your portal, go to the Documents tab and click 'Guided Interview' — our AI will walk you through it question by question. You only share what you are comfortable sharing. The AI can also write a draft for you to edit if that's easier.", created_at: new Date(Date.now() - 3 * 86400000 + 3600000).toISOString() },
    ]);

    // ── VETERAN 3: MASTER SERGEANT MARIA GARCIA (auth: maria.garcia@veteran.demo) ──
    const { data: v3 } = await supabase.from("veterans").insert({
      user_id: AUTH_MARIA,
      organization_id: orgId,
      first_name: "Maria",
      last_name: "Garcia",
      email: "maria.garcia@veteran.demo",
      phone: "(210) 555-0303",
      date_of_birth: "1975-11-03",
      branch_of_service: "Air Force",
      service_start_date: "2002-09-20",
      service_end_date: "2022-09-20",
      discharge_status: "Honorable",
      va_file_number: "22-789-115",
      ssn_last_four: "3309",
      address: { street: "9800 Randolph AFB Rd", city: "San Antonio", state: "TX", zip: "78148" },
    }).select().single();
    if (!v3) throw new Error("Failed to create Maria Garcia");

    const { data: c3 } = await supabase.from("cases").insert({
      organization_id: orgId,
      site_id: siteId,
      veteran_id: v3.id,
      case_number: "CC-2026-0003",
      status: "intake_complete",
      priority: "normal",
      packet_readiness_score: 72,
      intake_completeness: 80,
      citation_coverage: 65,
      sla_due_at: new Date(Date.now() + 21 * 86400000).toISOString(),
      notes: "20-year retiree. First-time filer. Very organized documentation. Ready for VSO initial review and VASRD code assignment.",
    }).select().single();
    if (!c3) throw new Error("Failed to create Maria case");

    const { data: mConds } = await supabase.from("conditions").insert([
      {
        case_id: c3.id,
        name: "Bilateral Sensorineural Hearing Loss",
        icd_code: "H90.3",
        status: "approved",
        confidence: 0.97,
        onset_date: "2010-01-01",
        onset_description: "Progressive bilateral hearing loss documented since 2010. Consistent with 20 years of aircraft noise exposure on flight line (F-15, F-22, F-35).",
        symptoms: ["Bilateral hearing loss", "Tinnitus (bilateral)", "Difficulty in noisy environments", "Reliance on captions"],
        functional_impact: "Cannot use standard telephone. Requires hearing aids. Social isolation due to communication difficulties.",
        current_severity: "severe",
        treatments: ["Bilateral hearing aids (VA issued 2022)", "Audiological monitoring"],
        ai_summary: "Audiogram confirms moderate-to-severe bilateral sensorineural hearing loss consistent with noise-induced origin. 20-year exposure to aircraft engines documented in SMRs and career history. Rating likely 50-60% bilateral.",
        conflict_flags: [],
      },
      {
        case_id: c3.id,
        name: "Hypertension (Essential), Service-Connected",
        icd_code: "I10",
        status: "approved",
        confidence: 0.83,
        onset_date: "2014-06-01",
        onset_description: "Hypertension first diagnosed 2014 during periodic flight physical. Progressive despite lifestyle changes.",
        symptoms: ["Elevated blood pressure (avg 158/96)", "Occasional headaches", "Fatigue"],
        functional_impact: "Requires daily medication. Restricted from high-stress activities.",
        current_severity: "moderate",
        treatments: ["Lisinopril 20mg", "Hydrochlorothiazide 25mg", "DASH diet compliance"],
        ai_summary: "HTN documented in periodic flight physicals beginning 2014. Service-related stress and occupational exposures support service connection. Can be claimed directly or as secondary.",
        conflict_flags: [],
      },
      {
        case_id: c3.id,
        name: "Left Knee Patellofemoral Syndrome with Degenerative Changes",
        icd_code: "M22.2X2",
        status: "draft",
        confidence: 0.78,
        onset_date: "2018-08-15",
        onset_description: "Left knee pain following multiple field exercises and prolonged standing on flight line concrete surfaces.",
        symptoms: ["Anterior knee pain", "Crepitus with movement", "Swelling after activity", "Difficulty with stairs"],
        functional_impact: "Cannot run. Limits walking to 1-2 miles. Difficulty with prolonged standing.",
        current_severity: "mild",
        treatments: ["Naproxen PRN", "Knee brace", "Physical therapy (2019, 8 sessions)"],
        ai_summary: "X-ray demonstrates early degenerative changes at patellofemoral joint. In-service physical therapy records confirm onset during active duty. Rating likely 10-20%.",
        conflict_flags: [],
      },
    ]).select();

    await supabase.from("documents").insert([
      {
        case_id: c3.id,
          file_name: "DD214_Garcia_Maria.pdf",
          file_path: `demo/${c3.id}/dd214_maria_garcia.pdf`,
        file_size: 312000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 4,
        processing_status: "complete",
        processing_progress: 100,
          ocr_text: "DD Form 214 — Garcia, Maria L. Branch: US Air Force. Period: 20 SEP 2002 – 20 SEP 2022. Characterization: Honorable. Rank: MSgt (E-7). AFSC: 2A671 — Aerospace Propulsion. Assignments: Langley AFB (F-22), Kadena AB (F-15), Luke AFB (F-35). Awards: Meritorious Service Medal x3, Air Force Commendation Medal x4, NCO of the Year 2016.",
        metadata: { ai_analysis: { conditions_found: 0, snippets_extracted: 4 } },
      },
      {
        case_id: c3.id,
        file_name: "AudiologicalEvaluation_Garcia_2024.pdf",
        file_path: `demo/${c3.id}/audiology_maria_garcia.pdf`,
        file_size: 420000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 6,
        processing_status: "complete",
        processing_progress: 100,
          ocr_text: "AUDIOLOGICAL EVALUATION — Wilford Hall VAMC, San Antonio. Patient: Maria L. Garcia. Date: 03/15/2024. Findings: Bilateral sensorineural hearing loss. Right ear: 65dB PTA. Left ear: 70dB PTA. SDS Right: 72%. SDS Left: 68%. Diagnosis: Moderate-severe bilateral SNHL, noise-induced etiology consistent with aircraft engine exposure. Bilateral tinnitus confirmed.",
        metadata: { ai_analysis: { conditions_found: 2, snippets_extracted: 12 } },
      },
      {
        case_id: c3.id,
        file_name: "ServiceTreatmentRecords_Garcia_Selected.pdf",
        file_path: `demo/${c3.id}/str_maria_garcia.pdf`,
        file_size: 2100000,
        mime_type: "application/pdf",
        category: "str",
        page_count: 55,
        processing_status: "complete",
        processing_progress: 100,
          ocr_text: "USAF Medical Records — Garcia, Maria L. Highlights: 2010 Hearing Conservation Program — bilateral threshold shift noted. 2014 Flight Physical — HTN diagnosis, started Lisinopril. 2018 Left knee injury report — physical therapy referral. 2019 Knee PT completion notes — improvement but residual symptoms. Periodic physicals 2002-2022 on file.",
        metadata: { ai_analysis: { conditions_found: 3, snippets_extracted: 18 } },
      },
      {
        case_id: c3.id,
        file_name: "Personal_Statement_Garcia_Maria.pdf",
        file_path: `demo/${c3.id}/personal_statement_maria.pdf`,
        file_size: 52000,
        mime_type: "application/pdf",
        category: "personal_statement",
        page_count: 2,
        processing_status: "complete",
        processing_progress: 100,
          ocr_text: "PERSONAL STATEMENT — Maria L. Garcia, MSgt USAF (Ret.)\n\nI served 20 years maintaining America's most advanced fighter aircraft. Standing next to F-22 and F-15 engines daily has cost me the ability to hear a normal conversation without my hearing aids. My blood pressure has required medication since 2014 and has never returned to normal despite a healthy lifestyle. My left knee began deteriorating in 2018 from years of standing on concrete flight lines. I am proud of my service and I am requesting the disability compensation I have earned.",
        metadata: { ai_analysis: { conditions_found: 3, snippets_extracted: 6 } },
      },
    ]);

    const mCond1 = mConds?.[0];
    const mCond3 = mConds?.[2];

    await supabase.from("evidence_gaps").insert([
      { case_id: c3.id, condition_id: mCond1?.id || null, category_name: "Hearing Conservation Program Records", gap_status: "supported", description: "Annual audiogram from Hearing Conservation Program showing progressive threshold shift in service." },
      { case_id: c3.id, condition_id: mCond1?.id || null, category_name: "Noise Exposure Documentation", gap_status: "supported", description: "AFSC 2A671 occupational records confirm 20-year high-noise environment exposure." },
      { case_id: c3.id, condition_id: mCond3?.id || null, category_name: "Nexus Letter (Knee)", gap_status: "missing", description: "Medical opinion linking knee condition to occupational requirements of AFSC 2A671 role." },
      { case_id: c3.id, condition_id: null, category_name: "VASRD Code Assignment", gap_status: "missing", description: "VSO needs to assign diagnostic codes from VASRD Schedule for all three conditions before packet build." },
    ]);

    await supabase.from("veteran_tasks").insert([
      { case_id: c3.id, veteran_id: v3.id, task_type: "upload", title: "Upload DD-214", description: "Certificate of Release or Discharge from Active Duty.", status: "completed", completed_at: new Date(Date.now() - 8 * 86400000).toISOString() },
      { case_id: c3.id, veteran_id: v3.id, task_type: "upload", title: "Upload Audiological Evaluation", description: "VA or civilian audiology report with pure-tone averages and speech discrimination scores.", status: "completed", completed_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { case_id: c3.id, veteran_id: v3.id, task_type: "upload", title: "Upload Service Treatment Records", description: "Select key medical records from your service years.", status: "completed", completed_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { case_id: c3.id, veteran_id: v3.id, task_type: "provide_statement", title: "Write Personal Statement", description: "Describe your service, conditions, and their ongoing impact.", status: "completed", completed_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { case_id: c3.id, veteran_id: v3.id, task_type: "upload", title: "Upload Nexus Letter for Knee Condition", description: "Request a medical opinion from your treating orthopedic provider linking your knee condition to your occupational duties.", status: "sent", due_date: new Date(Date.now() + 14 * 86400000).toISOString() },
    ]);

    await supabase.from("case_messages").insert([
      { case_id: c3.id, sender_id: "00000000-0000-0000-0000-000000000001", sender_type: "staff", sender_name: "ClearClaim AI", content: "Welcome to ClearClaim, Maria. Your case has been created and assigned to the Houston VSO office. You can track all progress here.", created_at: new Date(Date.now() - 8 * 86400000).toISOString() },
      { case_id: c3.id, sender_id: v3.id, sender_type: "veteran", sender_name: "Maria Garcia", content: "Hello. I just retired after 20 years and was told I should file a claim. I've uploaded everything I have.", created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
      { case_id: c3.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "David Park, VSO", content: "Maria, thank you for your service and welcome to ClearClaim! Our AI has already analyzed everything you uploaded. I'm seeing three very strong conditions here. The hearing loss case is textbook — 20 years next to jet engines with audiograms showing exactly the pattern we need. Your packet readiness is already at 72% — that's excellent for a first filing.", created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { case_id: c3.id, sender_id: v3.id, sender_type: "veteran", sender_name: "Maria Garcia", content: "That's great to hear. I just need the one thing — a nexus letter for the knee. My orthopedist is civilian. Will that work?", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
      { case_id: c3.id, sender_id: "00000000-0000-0000-0000-000000000002", sender_type: "staff", sender_name: "David Park, VSO", content: "Yes, civilian providers are perfectly acceptable for nexus letters. I've used our AI to generate a template you can give directly to your orthopedist — it lays out exactly what the VA needs the letter to say. Check the AI Tools tab. Once that's in, we can build your packet and submit.", created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { case_id: c3.id, sender_id: "00000000-0000-0000-0000-000000000001", sender_type: "staff", sender_name: "ClearClaim AI", content: "[AI Notification] Document 'AudiologicalEvaluation_Garcia_2024.pdf' analyzed. Found 2 conditions and 12 evidence snippets. Task 'Upload Audiological Evaluation' automatically marked complete.", created_at: new Date(Date.now() - 6 * 86400000 + 60000).toISOString() },
    ]);

    return NextResponse.json({
      success: true,
      message: "Full demo data seeded successfully — 3 veterans, 3 cases, 9 conditions, 11 documents, 13 tasks, 16 messages, 13 evidence gaps",
        veterans: [
          { name: "James Mitchell", id: v1.id, case: "CC-2026-0001", case_id: c1.id, status: "review", readiness: "85%", conditions: 3, documents: 4, tasks_pending: 2 },
          { name: "Robert Johnson", id: v2.id, case: "CC-2026-0002", case_id: c2.id, status: "processing", readiness: "45%", conditions: 3, documents: 1, tasks_pending: 3 },
          { name: "Maria Garcia", id: v3.id, case: "CC-2026-0003", case_id: c3.id, status: "intake_complete", readiness: "72%", conditions: 3, documents: 4, tasks_pending: 1 },
        ],
      demo_urls: {
        staff_inbox: "/staff",
        james_case: `/staff/case/${c1.id}`,
        robert_case: `/staff/case/${c2.id}`,
        maria_case: `/staff/case/${c3.id}`,
        demo_guide: "/demo",
      }
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Seed error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
