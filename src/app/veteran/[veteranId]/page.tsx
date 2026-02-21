"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield,
  User,
  ArrowLeft,
  ClipboardList,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Heart,
  ChevronRight,
  Bell,
  MessageSquare,
  Camera,
  Loader2,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface VeteranData {
  veteran: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    branch_of_service: string;
    service_start_date: string;
    service_end_date: string;
    discharge_status: string;
  };
  cases: Array<{
    id: string;
    case_number: string;
    status: string;
    priority: string;
    intake_completeness: number;
    packet_readiness_score: number;
    sla_due_at: string;
    created_at: string;
  }>;
  conditions: Array<{
    id: string;
    case_id: string;
    name: string;
    status: string;
    confidence: number;
    ai_summary: string;
    functional_impact: string;
  }>;
  tasks: Array<{
    id: string;
    case_id: string;
    task_type: string;
    title: string;
    description: string;
    status: string;
    due_date: string;
    completed_at: string | null;
  }>;
  gaps: Array<{
    id: string;
    case_id: string;
    category_name: string;
    gap_status: string;
    description: string;
  }>;
  documents: Array<{
    id: string;
    case_id: string;
    filename: string;
    doc_type: string;
    upload_source: string;
    page_count: number;
    created_at: string;
  }>;
}

type Tab = "overview" | "tasks" | "documents" | "messages";

const statusLabels: Record<string, { label: string; color: string }> = {
  intake_pending: { label: "Intake Pending", color: "bg-yellow-100 text-yellow-700" },
  intake_in_progress: { label: "Intake In Progress", color: "bg-yellow-100 text-yellow-700" },
  intake_complete: { label: "Intake Complete", color: "bg-blue-100 text-blue-700" },
  processing: { label: "In Processing", color: "bg-blue-100 text-blue-700" },
  review: { label: "Under Review", color: "bg-purple-100 text-purple-700" },
  packet_building: { label: "Building Packet", color: "bg-indigo-100 text-indigo-700" },
  submitted: { label: "Submitted to VA", color: "bg-green-100 text-green-700" },
  decided: { label: "Decision Received", color: "bg-green-100 text-green-700" },
};

const taskTypeIcons: Record<string, typeof Upload> = {
  upload: Upload,
  answer_questions: ClipboardList,
  clarify_timeline: Calendar,
  provide_statement: FileText,
  other: ClipboardList,
};

const caseSteps = [
  { key: "intake_pending", label: "Intake" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Review" },
  { key: "packet_building", label: "Packet Build" },
  { key: "submitted", label: "Submitted" },
  { key: "decided", label: "Decision" },
];

function getStepIndex(status: string): number {
  if (status === "intake_pending" || status === "intake_in_progress") return 0;
  if (status === "intake_complete" || status === "processing") return 1;
  if (status === "review") return 2;
  if (status === "packet_building") return 3;
  if (status === "submitted") return 4;
  if (status === "decided") return 5;
  return 0;
}

function daysUntil(date: string): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function VeteranDashboard() {
  const params = useParams();
  const router = useRouter();
  const veteranId = params.veteranId as string;
  const [data, setData] = useState<VeteranData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [statementModal, setStatementModal] = useState<string | null>(null);
  const [statementText, setStatementText] = useState("");

  const fetchData = useCallback(() => {
    fetch(`/api/veteran/${veteranId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [veteranId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data?.veteran) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-gray-500">Veteran not found</p>
          <Link href="/veteran">
            <Button className="mt-4">Back to Portal</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { veteran, cases, conditions, tasks, gaps, documents } = data;
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "sent");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const primaryCase = cases[0];
  const caseConditions = primaryCase ? conditions.filter((c) => c.case_id === primaryCase.id) : [];
  const caseGaps = primaryCase ? gaps.filter((g) => g.case_id === primaryCase.id) : [];
  const caseTasks = primaryCase ? tasks.filter((t) => t.case_id === primaryCase.id) : [];
  const caseDocs = primaryCase ? documents.filter((d) => d.case_id === primaryCase.id) : [];

  const tabs: { key: Tab; label: string; icon: typeof ClipboardList; count?: number }[] = [
    { key: "overview", label: "My Case", icon: Heart },
    { key: "tasks", label: "Action Items", icon: ClipboardList, count: pendingTasks.length },
    { key: "documents", label: "Documents", icon: FileText, count: caseDocs.length },
    { key: "messages", label: "Updates", icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-30">
        <div className="mx-auto max-w-5xl flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">ClearClaim</span>
              <span className="text-xs text-gray-500 block">Veteran Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-900">
                {veteran.first_name} {veteran.last_name}
              </div>
              <div className="text-xs text-gray-500">{veteran.branch_of_service}</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Welcome + Quick Stats */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Welcome back, {veteran.first_name}
              </h1>
              <p className="text-sm text-gray-500">
                Here&apos;s the latest on your claim.
                {primaryCase && (
                  <span className="text-gray-400"> Case {primaryCase.case_number}</span>
                )}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push("/veteran")}>
              <ArrowLeft className="mr-1 h-4 w-4" /> Switch Profile
            </Button>
          </div>

          {/* Quick stat cards */}
          {primaryCase && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <Badge className={cn("text-xs", statusLabels[primaryCase.status]?.color || "bg-gray-100 text-gray-600")}>
                  {statusLabels[primaryCase.status]?.label || primaryCase.status}
                </Badge>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-400 mb-1">Packet Readiness</div>
                <div className="text-lg font-bold text-gray-900">{primaryCase.packet_readiness_score}%</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-400 mb-1">Pending Tasks</div>
                <div className="text-lg font-bold text-gray-900">{pendingTasks.length}</div>
              </div>
              <div className="rounded-xl border bg-white p-3">
                <div className="text-xs text-gray-400 mb-1">Conditions</div>
                <div className="text-lg font-bold text-gray-900">{caseConditions.length}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    tab === t.key ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === "overview" && primaryCase && (
          <div className="space-y-6">
            {/* Case Progress Tracker */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Claim Progress</h2>
              <div className="flex items-center justify-between">
                {caseSteps.map((step, i) => {
                  const currentIdx = getStepIndex(primaryCase.status);
                  const isComplete = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1">
                      <div className="flex items-center w-full">
                        {i > 0 && (
                          <div
                            className={cn(
                              "flex-1 h-0.5",
                              i <= currentIdx ? "bg-blue-500" : "bg-gray-200"
                            )}
                          />
                        )}
                        <div
                          className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0",
                            isComplete
                              ? "bg-blue-600 border-blue-600 text-white"
                              : isCurrent
                              ? "border-blue-600 text-blue-600 bg-blue-50"
                              : "border-gray-200 text-gray-400 bg-white"
                          )}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            i + 1
                          )}
                        </div>
                        {i < caseSteps.length - 1 && (
                          <div
                            className={cn(
                              "flex-1 h-0.5",
                              i < currentIdx ? "bg-blue-500" : "bg-gray-200"
                            )}
                          />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs mt-2 text-center",
                          isCurrent ? "text-blue-600 font-medium" : "text-gray-400"
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Urgent Tasks Banner */}
            {pendingTasks.filter((t) => daysUntil(t.due_date) <= 7).length > 0 && (
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-800 text-sm">Action Required</div>
                    <p className="text-sm text-amber-700 mt-1">
                      You have {pendingTasks.filter((t) => daysUntil(t.due_date) <= 7).length} task(s) due within the next 7 days.
                      Completing these will help move your claim forward.
                    </p>
                    <Button
                      size="sm"
                      className="mt-2 bg-amber-600 hover:bg-amber-700"
                      onClick={() => setTab("tasks")}
                    >
                      View Tasks <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Conditions */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Your Claimed Conditions ({caseConditions.length})
              </h2>
                <div className="space-y-3">
                  {caseConditions.map((cond) => {
                    const condGaps = caseGaps.filter((g: any) => g.condition_id === cond.id);
                    const missingGaps = condGaps.filter((g) => g.gap_status === "missing");

                  return (
                    <div key={cond.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{cond.name}</div>
                          <p className="text-sm text-gray-500 mt-1">{cond.ai_summary}</p>
                        </div>
                        <Badge
                          className={cn(
                            "shrink-0 ml-2",
                            cond.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : cond.status === "draft"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-yellow-100 text-yellow-700"
                          )}
                        >
                          {cond.status === "approved" ? "Ready" : cond.status === "draft" ? "In Review" : cond.status}
                        </Badge>
                      </div>
                      {cond.functional_impact && (
                        <div className="mt-2 text-xs text-gray-400">
                          <span className="font-medium text-gray-500">Impact:</span> {cond.functional_impact}
                        </div>
                      )}
                      {missingGaps.length > 0 && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          {missingGaps.length} missing evidence item(s) -- check your tasks
                        </div>
                      )}
                      {/* Evidence strength bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-400">Evidence Strength</span>
                          <span className="font-medium text-gray-600">{Math.round(cond.confidence * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              cond.confidence >= 0.9
                                ? "bg-green-500"
                                : cond.confidence >= 0.7
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            )}
                            style={{ width: `${cond.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {caseConditions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No conditions recorded yet. Complete your intake to get started.
                  </p>
                )}
              </div>
            </div>

            {/* Packet Readiness */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Packet Readiness</h2>
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        primaryCase.packet_readiness_score >= 80
                          ? "#22c55e"
                          : primaryCase.packet_readiness_score >= 50
                          ? "#3b82f6"
                          : "#f59e0b"
                      }
                      strokeWidth="8"
                      strokeDasharray={`${primaryCase.packet_readiness_score * 2.51} 251`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-900">
                      {primaryCase.packet_readiness_score}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    {primaryCase.packet_readiness_score >= 80
                      ? "Your packet is nearly ready for submission. Just a few items remaining."
                      : primaryCase.packet_readiness_score >= 50
                      ? "Good progress! Complete your remaining tasks to strengthen your claim."
                      : "Your packet needs more evidence. Complete the action items to build a stronger claim."}
                  </p>
                  {caseGaps.filter((g) => g.gap_status === "missing").length > 0 && (
                    <div className="text-xs text-gray-400">
                      {caseGaps.filter((g) => g.gap_status === "missing").length} missing evidence items
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "tasks" && (
          <div className="space-y-6">
            {/* Pending Tasks */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">
                Pending Tasks ({pendingTasks.length})
              </h2>
              {pendingTasks.length === 0 ? (
                <div className="rounded-xl border bg-white p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">No pending tasks right now.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => {
                    const IconComp = taskTypeIcons[task.task_type] || ClipboardList;
                    const daysLeft = daysUntil(task.due_date);
                    const isOverdue = daysLeft < 0;
                    const isUrgent = daysLeft <= 3;
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-xl border bg-white p-4",
                          isOverdue ? "border-red-200" : isUrgent ? "border-amber-200" : ""
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                              task.task_type === "upload"
                                ? "bg-blue-50 text-blue-600"
                                : task.task_type === "provide_statement"
                                ? "bg-purple-50 text-purple-600"
                                : "bg-slate-50 text-slate-600"
                            )}
                          >
                            <IconComp className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-medium text-gray-900">{task.title}</div>
                              {isOverdue ? (
                                <Badge className="bg-red-100 text-red-700 shrink-0">Overdue</Badge>
                              ) : isUrgent ? (
                                <Badge className="bg-amber-100 text-amber-700 shrink-0">
                                  {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400 shrink-0">
                                  Due {formatDate(task.due_date)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                            <div className="flex items-center gap-2 mt-3">
                              {task.task_type === "upload" && (
                                <>
                                  <Button size="sm">
                                    <Upload className="mr-1 h-4 w-4" /> Upload File
                                  </Button>
                                  <Button size="sm" variant="outline">
                                    <Camera className="mr-1 h-4 w-4" /> Take Photo
                                  </Button>
                                </>
                              )}
                              {task.task_type === "provide_statement" && (
                                <Button size="sm" onClick={() => setStatementModal(task.id)}>
                                  <FileText className="mr-1 h-4 w-4" /> Write Statement
                                </Button>
                              )}
                              {task.task_type === "answer_questions" && (
                                <Button size="sm">
                                  <ClipboardList className="mr-1 h-4 w-4" /> Start Questionnaire
                                </Button>
                              )}
                              {task.task_type === "clarify_timeline" && (
                                <Button size="sm">
                                  <Calendar className="mr-1 h-4 w-4" /> Review Timeline
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-3">
                  Completed ({completedTasks.length})
                </h2>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border bg-white p-4 flex items-center gap-3 opacity-75"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-700 line-through">{task.title}</div>
                        {task.completed_at && (
                          <div className="text-xs text-gray-400">
                            Completed {formatDate(task.completed_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "documents" && (
          <div className="space-y-6">
            {/* Upload area */}
            <div className="rounded-xl border-2 border-dashed bg-white p-8 text-center">
              <Upload className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-700">Upload New Documents</p>
              <p className="text-sm text-gray-400 mt-1">
                Drag and drop files here, or click to browse
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button size="sm">
                  <Upload className="mr-1 h-4 w-4" /> Browse Files
                </Button>
                <Button size="sm" variant="outline">
                  <Camera className="mr-1 h-4 w-4" /> Take Photo
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                PDF, JPG, PNG, DOC up to 25MB
              </p>
            </div>

            {/* Missing documents alert */}
            {caseGaps.filter((g) => g.gap_status === "missing").length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-amber-800">Missing Documents</div>
                    <ul className="text-sm text-amber-700 mt-2 space-y-1">
                      {caseGaps
                        .filter((g) => g.gap_status === "missing")
                        .map((gap) => (
                          <li key={gap.id} className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {gap.category_name}: {gap.description}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Document List */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Uploaded Documents ({caseDocs.length})
              </h2>
              {caseDocs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No documents uploaded yet. Upload your first document above.
                </p>
              ) : (
                <div className="space-y-2">
                  {caseDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{doc.filename}</div>
                        <div className="text-xs text-gray-400">
                          {doc.doc_type} &middot; {doc.page_count} pages &middot; {formatDate(doc.created_at)}
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-700 text-xs">Uploaded</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "messages" && (
          <div className="space-y-4">
            {/* Simulated timeline/messages */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">Claim Updates</h2>
              <div className="space-y-4">
                {[
                  {
                    date: "Feb 18, 2026",
                    title: "New tasks assigned",
                    desc: `Your caseworker has assigned ${caseTasks.length} new action items. Please review and complete them by the due dates.`,
                    type: "task",
                  },
                  {
                    date: "Feb 17, 2026",
                    title: "Case status updated",
                    desc: `Your claim status has been updated to "${statusLabels[primaryCase?.status || ""]?.label || primaryCase?.status}".`,
                    type: "status",
                  },
                  {
                    date: "Feb 15, 2026",
                    title: "Evidence review in progress",
                    desc: "Your caseworker is reviewing the evidence submitted so far and identifying any gaps.",
                    type: "info",
                  },
                  {
                    date: "Feb 10, 2026",
                    title: "Claim created",
                    desc: "Your VA disability claim case has been created and assigned to a caseworker.",
                    type: "info",
                  },
                ].map((msg, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center",
                          msg.type === "task"
                            ? "bg-amber-100 text-amber-600"
                            : msg.type === "status"
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-500"
                        )}
                      >
                        {msg.type === "task" ? (
                          <ClipboardList className="h-4 w-4" />
                        ) : msg.type === "status" ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                      {i < 3 && <div className="w-px flex-1 bg-gray-200 my-1" />}
                    </div>
                    <div className="pb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">{msg.title}</span>
                        <span className="text-xs text-gray-400">{msg.date}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{msg.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact caseworker */}
            <div className="rounded-xl border bg-white p-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Need Help?</h2>
              <p className="text-sm text-gray-500 mb-4">
                If you have questions about your claim or need assistance, you can send a message to your caseworker.
              </p>
              <div className="flex gap-2">
                <Textarea placeholder="Type your message here..." rows={3} className="flex-1" />
              </div>
              <div className="flex justify-end mt-2">
                <Button size="sm">
                  <MessageSquare className="mr-1 h-4 w-4" /> Send Message
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statement Writing Modal */}
      {statementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Write Your Statement</h3>
              <button onClick={() => setStatementModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Describe in your own words how your conditions affect your daily life. Be specific about what you can and cannot do.
            </p>
            <Textarea
              value={statementText}
              onChange={(e) => setStatementText(e.target.value)}
              rows={8}
              placeholder="In my daily life, my conditions affect me in the following ways..."
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">{statementText.length} characters</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStatementModal(null)}>
                  Cancel
                </Button>
                <Button onClick={() => setStatementModal(null)}>
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Submit Statement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
