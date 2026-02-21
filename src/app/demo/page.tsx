"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  Shield, Users, ClipboardList, FileText, Brain, Zap, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, MessageSquare, Upload, TrendingUp,
  Stethoscope, ArrowRight, RefreshCw, ExternalLink, Play, Star,
  BookOpen, Package, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface DemoCase {
  id: string;
  case_number: string;
  status: string;
  priority: string;
  packet_readiness_score: number;
  veteran: { id: string; first_name: string; last_name: string; branch_of_service: string };
}

const DEMO_FLOW_STEPS = [
  {
    phase: "Phase 1",
    title: "Veteran Submits & Uploads",
    color: "blue",
    icon: Upload,
    description: "The veteran logs in to their portal, reviews their assigned tasks, and uploads their documents. Watch the AI parse each document in real time.",
    steps: [
      "Open the Veteran Portal for James Mitchell",
      "Review the Overview tab — see claim status (85% ready), 3 conditions, 2 pending tasks",
      "Navigate to the Documents tab",
      "Drag & drop a file onto the upload zone (try 'Nexus_Letter_PTSD.pdf')",
      "Watch the AI processing pipeline: Uploading → Scanning → Extracting → Indexing",
      "See the badge appear showing conditions found and evidence snippets",
      "Navigate to Tasks tab — watch the task auto-complete if the filename matches",
    ],
    demo_files: [
      { name: "Nexus_Letter_PTSD.pdf", purpose: "Links PTSD to IED blast — will auto-complete the Nexus Letter task" },
      { name: "NeuroPsych_Eval_2026.pdf", purpose: "Neuropsych evaluation — will extract mTBI evidence snippets" },
      { name: "BuddyStatement_Mitchell.pdf", purpose: "Fellow soldier statement corroborating back injury" },
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Assistant — Veteran Side",
    color: "green",
    icon: Brain,
    description: "Show the AI tools available to the veteran: the claims assistant, guided statement writer, C&P exam prep, and rating estimator.",
    steps: [
      "Navigate to the AI Assistant tab",
      "Click 'Draft my personal statement' quick prompt — watch Gemini write a full statement",
      "Copy the statement to the Statement Editor and submit it",
      "Navigate to C&P Prep tab — click 'Generate Guide' for PTSD",
      "Navigate to Rating Estimate tab — click Estimate My Rating",
      "Show the combined rating calculation and improvement opportunities",
    ],
    demo_files: [],
  },
  {
    phase: "Phase 3",
    title: "VSO Reviews the Case",
    color: "purple",
    icon: ClipboardList,
    description: "Switch to the VSO (staff) side. Show the live case inbox, then dive into the full case dashboard.",
    steps: [
      "Open the Staff Inbox at /staff",
      "Point out the Live Case Alerts sidebar — shows real-time uploads and messages",
      "Explain the readiness scores and SLA indicators",
      "Click into James Mitchell's case (CC-2026-0001)",
      "Show the AI Case Strategy banner — it has already analyzed the case and suggested 3 next steps",
      "Review the status pipeline at the top (click to advance stages)",
      "Show the 3 conditions with approve/reject controls",
      "Point out confidence scores and AI summaries for each condition",
    ],
    demo_files: [],
  },
  {
    phase: "Phase 4",
    title: "VSO AI Tools in Action",
    color: "amber",
    icon: Zap,
    description: "Show every AI tool available to the VSO: case narrative, rating estimator, nexus letter drafter, secondary condition finder, and smart replies.",
    steps: [
      "Navigate to the AI Tools tab on the case",
      "Click 'Generate Narrative' — AI writes a comprehensive case summary for the packet",
      "Click 'Estimate Rating' — AI calculates combined rating using VA math",
      "Click into Nexus Letter Drafter — select PTSD condition, generate the template letter",
      "Copy the letter — show how this gets sent to the veteran's doctor",
      "Click 'Find Secondary Conditions' — AI suggests TBI, sleep apnea, depression as secondary claims",
      "Click 'Add' on a suggestion — it instantly appears in the conditions list as a draft",
    ],
    demo_files: [],
  },
  {
    phase: "Phase 5",
    title: "Real-Time Messaging",
    color: "rose",
    icon: MessageSquare,
    description: "Demonstrate the real-time two-way messaging between veteran and VSO, including AI-generated smart reply suggestions.",
    steps: [
      "Open two browser windows: the Staff case Messages tab + the Veteran Portal Messages tab",
      "Send a message from the veteran portal",
      "Watch it appear instantly in the staff portal (no refresh needed)",
      "In the staff portal, click the ⚡ Smart Reply button",
      "AI generates 3 contextual reply suggestions — click one to populate the message box",
      "Send the reply — watch it appear instantly in the veteran portal",
    ],
    demo_files: [],
  },
  {
    phase: "Phase 6",
    title: "Veteran Tasks & Workflow",
    color: "indigo",
    icon: CheckCircle2,
    description: "Show how the VSO assigns tasks to the veteran and how the veteran completes them, completing the full workflow loop.",
    steps: [
      "From the staff case dashboard, navigate to the Veteran Tasks tab",
      "Click 'Send New Task' — select 'Upload Nexus Letter'",
      "Task appears in the veteran's portal under Action Items immediately",
      "Switch to the veteran portal Tasks tab — show the new pending task",
      "Upload a file named 'nexus_letter.pdf' in the Documents tab",
      "Watch the AI auto-complete the nexus letter task and send a system notification",
      "VSO sees the task completion appear in real time",
    ],
    demo_files: [],
  },
];

const VETERANS = [
  {
    name: "James Mitchell",
    branch: "Army",
    case: "CC-2026-0001",
    status: "review",
    readiness: 85,
    priority: "urgent",
    conditions: ["PTSD (Approved)", "DDD Lumbar Spine (Approved)", "mTBI Residuals (Draft)"],
    story: "OEF combat vet, IED blast survivor, 8 years service. Strongest evidence profile — best for full demo.",
    color: "red",
    bestFor: "Full end-to-end demo",
  },
  {
    name: "Sarah Rodriguez",
    branch: "Navy",
    case: "CC-2026-0002",
    status: "processing",
    readiness: 45,
    priority: "high",
    conditions: ["Major Depressive Disorder (Approved)", "Chronic Pelvic Pain (Draft)", "GAD (Draft)"],
    story: "MST survivor, 8 years service. Records in transit. Demonstrates sensitive case handling and AI statement writer.",
    color: "purple",
    bestFor: "Demonstrating MST cases & AI statement writing",
  },
  {
    name: "Michael Chen",
    branch: "Air Force",
    case: "CC-2026-0003",
    status: "intake_complete",
    readiness: 72,
    priority: "normal",
    conditions: ["Bilateral Hearing Loss (Approved)", "Hypertension (Approved)", "L Knee DJD (Draft)"],
    story: "20-year retiree, first-time filer, extremely organized documentation. Great for showing hearing loss claims.",
    color: "blue",
    bestFor: "First-time filers & retirement claims",
  },
];

export default function DemoGuidePage() {
  const [cases, setCases] = useState<DemoCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    setLoading(true);
    const { data } = await supabase
      .from("cases")
      .select("id, case_number, status, priority, packet_readiness_score, veteran:veterans(id, first_name, last_name, branch_of_service)")
      .order("case_number");
    setCases((data as unknown as DemoCase[]) || []);
    setLoading(false);
  }

  async function handleReseed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/setup/seed-demo");
      const data = await res.json();
      if (data.success) {
        toast.success("Demo data refreshed! All veteran records, cases, and documents reset.");
        await fetchCases();
      } else {
        toast.error(data.error || "Failed to reseed demo");
      }
    } catch {
      toast.error("Failed to reseed demo");
    }
    setSeeding(false);
  }

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
    green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", badge: "bg-green-100 text-green-700" },
    purple: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
    amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
    rose: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", badge: "bg-rose-100 text-rose-700" },
    indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700" },
    red: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-700" },
  };

  const statusLabel: Record<string, string> = {
    intake_pending: "Intake Pending", intake_in_progress: "In Progress", intake_complete: "Intake Complete",
    processing: "Processing", review: "Review", packet_building: "Building", ready_for_export: "Ready", exported: "Exported",
  };

  const jamesCase = cases.find(c => c.case_number === "CC-2026-0001");
  const sarahCase = cases.find(c => c.case_number === "CC-2026-0002");
  const michaelCase = cases.find(c => c.case_number === "CC-2026-0003");
  const caseMap: Record<string, DemoCase | undefined> = {
    "CC-2026-0001": jamesCase,
    "CC-2026-0002": sarahCase,
    "CC-2026-0003": michaelCase,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">ClearClaim</span>
              <span className="text-xs text-gray-500 ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Demo Guide</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleReseed} disabled={seeding}>
              {seeding ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Resetting...</> : <><RefreshCw className="h-4 w-4 mr-2" /> Reset Demo Data</>}
            </Button>
            <Link href="/staff">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="h-4 w-4 mr-2" /> Open Staff Portal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">

        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Play className="h-5 w-5" />
                <span className="text-sm font-medium text-blue-200 uppercase tracking-wider">Demo Playbook</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">ClearClaim Platform Demo</h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Full end-to-end demonstration for VA advisors and VSOs. Three fully loaded veteran personas, complete document sets, and every AI feature pre-configured.
              </p>
            </div>
            <div className="hidden lg:block text-right">
              <div className="text-4xl font-bold">{cases.length}</div>
              <div className="text-blue-200 text-sm">Active Cases</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6 mt-8">
            {[
              { icon: Users, label: "Veterans", value: "3 personas" },
              { icon: Brain, label: "AI Features", value: "10 tools" },
              { icon: FileText, label: "Documents", value: "11 pre-loaded" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
                <stat.icon className="h-6 w-6 text-blue-200" />
                <div>
                  <div className="font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-blue-200">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Staff Inbox", href: "/staff", icon: ClipboardList, color: "blue" },
              { label: "VASRD Explorer", href: "/staff/vasrd", icon: BookOpen, color: "purple" },
              { label: "Gap Analysis", href: "/staff/gaps", icon: Search, color: "amber" },
              { label: "Packet Builder", href: "/staff/packets", icon: Package, color: "green" },
            ].map((link) => (
              <Link key={link.label} href={link.href}
                className="flex items-center gap-3 rounded-xl border bg-white p-4 hover:shadow-md transition-all group">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center bg-${link.color}-100`}>
                  <link.icon className={`h-5 w-5 text-${link.color}-600`} />
                </div>
                <span className="font-medium text-gray-800 group-hover:text-gray-900">{link.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-gray-600" />
              </Link>
            ))}
          </div>
        </div>

        {/* Veteran Personas */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Demo Veteran Personas</h2>
          <p className="text-sm text-gray-500 mb-4">Each veteran is at a different stage of the claims pipeline with realistic conditions, documents, and case history.</p>

          <div className="grid lg:grid-cols-3 gap-5">
            {VETERANS.map((vet) => {
              const liveCase = caseMap[vet.case];
              const c = colorMap[vet.color];
              return (
                <div key={vet.name} className={`rounded-xl border-2 ${c.border} ${c.bg} p-5 flex flex-col`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900">{vet.name}</h3>
                      <p className="text-xs text-gray-500">{vet.branch} · {vet.case}</p>
                    </div>
                    <Badge className={`text-xs ${c.badge}`}>{vet.priority}</Badge>
                  </div>

                  {loading ? (
                    <div className="h-12 bg-white/50 rounded-lg animate-pulse mb-3" />
                  ) : liveCase ? (
                    <div className="bg-white/60 rounded-lg p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{statusLabel[liveCase.status] || liveCase.status}</span>
                        <span className={`text-sm font-bold ${c.text}`}>{liveCase.packet_readiness_score}% ready</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-current rounded-full transition-all" style={{ width: `${liveCase.packet_readiness_score}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/60 rounded-lg p-3 mb-3 text-xs text-gray-400">No case found — run Reset Demo</div>
                  )}

                  <p className="text-xs text-gray-600 mb-3 leading-relaxed">{vet.story}</p>

                  <div className="space-y-1 mb-4">
                    {vet.conditions.map((cond) => (
                      <div key={cond} className="flex items-center gap-1.5 text-xs text-gray-700">
                        <div className={`w-1.5 h-1.5 rounded-full ${cond.includes("Approved") ? "bg-green-500" : "bg-yellow-400"}`} />
                        {cond}
                      </div>
                    ))}
                  </div>

                  <div className={`text-xs font-medium ${c.text} flex items-center gap-1 mb-4`}>
                    <Star className="h-3 w-3" /> Best for: {vet.bestFor}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    {liveCase && (
                      <Link href={`/staff/case/${liveCase.id}`} className="flex-1">
                        <Button size="sm" variant="outline" className="w-full text-xs">
                          <ClipboardList className="h-3 w-3 mr-1" /> VSO View
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demo Documents */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Demo Documents to Upload</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create these files on your desktop (they can be empty PDFs or real documents). The AI will analyze the <strong>filename</strong> to auto-complete tasks and the <strong>content</strong> to extract conditions. Drag and drop them into the veteran portal to show the full pipeline.
          </p>
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              { file: "DD214_Mitchell_James.pdf", veteran: "James Mitchell", auto: "Auto-completes DD-214 task", effect: "Extracts service dates, branch, MOS", category: "discharge_documents" },
              { file: "Nexus_Letter_PTSD_Mitchell.pdf", veteran: "James Mitchell", auto: "Auto-completes Nexus Letter task", effect: "AI extracts medical opinion connecting PTSD to service", category: "nexus_letter" },
              { file: "NeuroPsych_Eval_mTBI.pdf", veteran: "James Mitchell", auto: "None (new evidence)", effect: "AI extracts TBI residuals evidence snippets, may add new condition", category: "medical_records" },
              { file: "VA_Medical_Records_Mitchell.pdf", veteran: "James Mitchell", auto: "Auto-completes Medical Records task", effect: "AI finds PTSD diagnosis, treatment history, GAF score", category: "medical_records" },
              { file: "DD214_Rodriguez_Sarah.pdf", veteran: "Sarah Rodriguez", auto: "Auto-completes DD-214 task", effect: "Confirms honorable discharge, NAS Jacksonville assignment", category: "discharge_documents" },
              { file: "Personal_Statement_Rodriguez.pdf", veteran: "Sarah Rodriguez", auto: "Auto-completes Personal Statement task", effect: "AI identifies service nexus language, emotional impact details", category: "personal_statement" },
              { file: "AudiologicalEval_Chen.pdf", veteran: "Michael Chen", auto: "Auto-completes Audiology task", effect: "AI extracts dB levels, SDS scores, noise-induced etiology confirmation", category: "medical_records" },
              { file: "Nexus_Letter_Knee_Chen.pdf", veteran: "Michael Chen", auto: "Auto-completes Knee Nexus task", effect: "Medical opinion linking knee DJD to flight line occupational duties", category: "nexus_letter" },
            ].map((doc) => (
              <div key={doc.file} className="bg-white rounded-xl border p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 rounded px-2 py-0.5">{doc.file}</span>
                    <Badge variant="outline" className="text-xs">{doc.veteran}</Badge>
                  </div>
                  {doc.auto !== "None (new evidence)" && (
                    <div className="flex items-center gap-1.5 text-xs text-green-700 mb-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {doc.auto}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-blue-700">
                    <Brain className="h-3 w-3" />
                    {doc.effect}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Flow Steps */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Demo Script — Step by Step</h2>
          <p className="text-sm text-gray-500 mb-6">Follow this order to deliver a complete, compelling demonstration that covers both the veteran and VSO experience.</p>

          <div className="space-y-5">
            {DEMO_FLOW_STEPS.map((phase, idx) => {
              const c = colorMap[phase.color];
              const Icon = phase.icon;
              return (
                <div key={idx} className={`rounded-xl border ${c.border} overflow-hidden`}>
                  <div className={`${c.bg} p-5 flex items-start gap-4`}>
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${c.badge}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-bold uppercase tracking-widest ${c.text}`}>{phase.phase}</span>
                        <Badge className={`text-xs ${c.badge}`}>{idx + 1} of {DEMO_FLOW_STEPS.length}</Badge>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{phase.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{phase.description}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5">
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Steps to Show</h4>
                        <ol className="space-y-2">
                          {phase.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                              <span className={`shrink-0 mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-[11px] font-bold ${c.badge}`}>
                                {i + 1}
                              </span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {phase.demo_files.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Files to Use</h4>
                          <div className="space-y-2">
                            {phase.demo_files.map((file, i) => (
                              <div key={i} className="rounded-lg border bg-gray-50 p-3">
                                <div className="font-mono text-xs font-semibold text-gray-800 mb-1">{file.name}</div>
                                <div className="text-xs text-gray-500">{file.purpose}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Features Reference */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">All AI Features Reference</h2>
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              { name: "Document Analyzer", who: "Both", route: "/api/ai/analyze-document", desc: "Extracts conditions, evidence snippets, and functional impact from uploaded medical records using Gemini vision.", icon: FileText, color: "blue" },
              { name: "Veteran AI Assistant", who: "Veteran", route: "/api/ai/veteran-assistant", desc: "Answers veteran questions about the claims process, documents needed, what nexus letters are, etc.", icon: MessageSquare, color: "green" },
              { name: "Statement Writer", who: "Veteran", route: "/api/ai/statement-writer", desc: "Guided interview that asks the veteran questions and assembles a complete personal statement from their answers.", icon: Brain, color: "purple" },
              { name: "C&P Exam Prep", who: "Veteran", route: "/api/ai/cp-exam-prep", desc: "Per-condition guide: what to expect, questions the examiner will ask, tips for accuracy, what to bring.", icon: Stethoscope, color: "indigo" },
              { name: "Rating Estimator", who: "Both", route: "/api/ai/rating-estimator", desc: "Predicts VA disability ratings per condition using VASRD criteria, then calculates combined rating using VA math.", icon: TrendingUp, color: "emerald" },
              { name: "Gap Analyzer", who: "VSO", route: "/api/ai/analyze-gaps", desc: "Reviews all case evidence and identifies what's missing for each condition. Generates the AI Case Strategy banner.", icon: Search, color: "amber" },
              { name: "Case Narrative Generator", who: "VSO", route: "/api/ai/case-narrative", desc: "Writes a comprehensive narrative summary of the entire case for inclusion in the submission packet.", icon: FileText, color: "violet" },
              { name: "Nexus Letter Drafter", who: "VSO", route: "/api/ai/nexus-letter", desc: "Generates a medically and legally appropriate nexus letter template for the veteran's treating provider to sign.", icon: FileText, color: "rose" },
              { name: "Secondary Conditions Finder", who: "VSO", route: "/api/ai/secondary-conditions", desc: "Identifies conditions commonly secondary to the veteran's primary conditions — expanding the claim's scope.", icon: Zap, color: "orange" },
              { name: "Smart Reply Generator", who: "VSO", route: "/api/ai/smart-reply", desc: "Reads recent case messages and generates 3 contextual reply suggestions for the VSO to send to the veteran.", icon: MessageSquare, color: "teal" },
            ].map((tool) => (
              <div key={tool.name} className="bg-white rounded-xl border p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                  <tool.icon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{tool.name}</span>
                    <Badge variant="outline" className="text-[10px]">{tool.who}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{tool.desc}</p>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">{tool.route}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Live Case Status</h2>
            <button onClick={fetchCases} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <p className="font-medium">No demo data found.</p>
              <p className="text-sm mt-1">Click "Reset Demo Data" above to seed the database.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <Link key={c.id} href={`/staff/case/${c.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-gray-900">{c.case_number}</span>
                      <span className="text-sm text-gray-600">{c.veteran?.first_name} {c.veteran?.last_name}</span>
                      <span className="text-xs text-gray-400">— {c.veteran?.branch_of_service}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className="text-[10px] bg-gray-100 text-gray-600">{statusLabel[c.status] || c.status}</Badge>
                      <Badge className="text-[10px] bg-red-100 text-red-700">{c.priority}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className={`h-full rounded-full ${c.packet_readiness_score >= 75 ? "bg-green-500" : c.packet_readiness_score >= 40 ? "bg-yellow-500" : "bg-red-400"}`}
                        style={{ width: `${c.packet_readiness_score}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-8">{c.packet_readiness_score}%</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="text-center pb-8 text-xs text-gray-400">
          ClearClaim Demo Environment · Reset data at any time with the button above · Powered by Gemini 3.0 Flash
        </div>
      </main>
    </div>
  );
}
