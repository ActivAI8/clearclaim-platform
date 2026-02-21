"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
import {
  Shield, LogOut, FileText, CheckCircle2, Clock, AlertTriangle,
  MessageSquare, Send, Sparkles, X, Loader2, Copy, PenLine,
  Brain, TrendingUp, Stethoscope, ArrowRight, ChevronDown, ChevronUp,
  CloudUpload, ScanLine, Zap, CheckSquare, FilePlus, Upload,
  Eye, ChevronRight, Menu, Users, ShieldCheck, CircleDot,
  ClipboardCheck, Search as SearchIcon,
} from "lucide-react";

interface CaseMessage {
  id: string;
  case_id: string;
  sender_id: string;
  sender_type: string;
  sender_name: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

interface Props {
  user: User;
  veteran: Record<string, unknown>;
  cases: Array<Record<string, unknown>>;
  conditions: Array<Record<string, unknown>>;
  tasks: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  gaps: Array<Record<string, unknown>>;
  caseMessages: CaseMessage[];
}

type Tab = "overview" | "tasks" | "documents" | "assistant" | "messages" | "exam-prep" | "rating" | "buddy" | "evidence";

type ParsingFile = {
  name: string;
  stage: "uploading" | "scanning" | "extracting" | "indexing" | "complete" | "error";
  progress: number;
  conditionsFound?: number;
  snippetsFound?: number;
};

const STATUS_STEPS = [
  { key: "intake_pending", label: "Intake" },
  { key: "intake_in_progress", label: "In Progress" },
  { key: "intake_complete", label: "Complete" },
  { key: "processing", label: "Processing" },
  { key: "review", label: "Review" },
  { key: "packet_building", label: "Building" },
  { key: "ready_for_export", label: "Ready" },
];

const TAB_CONFIG: Array<{ key: Tab; label: string; short: string }> = [
  { key: "overview", label: "My Claim", short: "Claim" },
  { key: "tasks", label: "Action Items", short: "Tasks" },
  { key: "documents", label: "Documents", short: "Docs" },
  { key: "assistant", label: "AI Assistant", short: "AI" },
  { key: "buddy", label: "Buddy Statement", short: "Buddy" },
  { key: "evidence", label: "Evidence Check", short: "Evidence" },
  { key: "exam-prep", label: "C&P Exam Prep", short: "C&P" },
  { key: "rating", label: "Rating Estimate", short: "Rating" },
  { key: "messages", label: "Messages", short: "Msgs" },
];

export default function VeteranPortalClient({
  user,
  veteran: vetData,
  cases,
  conditions,
  tasks,
  documents,
  gaps,
  caseMessages,
}: Props) {
  const veteran = vetData as Record<string, unknown>;
  const [tab, setTab] = useState<Tab>("overview");
  const [uploading, setUploading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([
    {
      role: "assistant",
      content: `Welcome back, ${veteran.first_name}. I'm your ClearClaim AI — ask me anything about your claim, required documents, or how to strengthen your case.`,
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [msgList, setMsgList] = useState<CaseMessage[]>(caseMessages);
  const [sendingMsg, setSendingMsg] = useState(false);

  const [statementDraft, setStatementDraft] = useState("");
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementSaving, setStatementSaving] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsingFiles, setParsingFiles] = useState<ParsingFile[]>([]);

  const [swOpen, setSwOpen] = useState(false);
  const [swHistory, setSwHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [swInput, setSwInput] = useState("");
  const [swLoading, setSwLoading] = useState(false);
  const [swStatement, setSwStatement] = useState("");

  const [examPrep, setExamPrep] = useState<Record<string, Record<string, unknown>>>({});
  const [examPrepLoading, setExamPrepLoading] = useState<string | null>(null);
  const [expandedPrep, setExpandedPrep] = useState<string | null>(null);

  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingData, setRatingData] = useState<Record<string, unknown> | null>(null);

  // Buddy statement state
  const [buddyName, setBuddyName] = useState("");
  const [buddyRelationship, setBuddyRelationship] = useState("");
  const [buddyEvents, setBuddyEvents] = useState("");
  const [buddyStatement, setBuddyStatement] = useState("");
  const [buddyLoading, setBuddyLoading] = useState(false);

  // Evidence scorecard state
  const [evidenceScorecard, setEvidenceScorecard] = useState<Record<string, unknown> | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const activeCase = cases[0] as Record<string, unknown> | undefined;
  const caseConditions = conditions.filter((c) => c.case_id === activeCase?.id);
  const pendingTasks = tasks.filter((t) => t.status === "pending" || t.status === "sent");
  const completedTasks = tasks.filter((t) => t.status === "completed");
  const missingGaps = gaps.filter((g) => g.gap_status === "missing");

  const currentStepIndex = activeCase
    ? STATUS_STEPS.findIndex((s) => s.key === activeCase.status)
    : 0;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) processFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function processFiles(files: File[]) {
    if (!activeCase) {
      toast.error("No active case found. Please contact your VSO.");
      return;
    }
    setUploading(true);

    for (const file of files) {
      const entry: ParsingFile = { name: file.name, stage: "uploading", progress: 0 };
      setParsingFiles((prev) => [...prev, entry]);

      const updateFile = (name: string, update: Partial<ParsingFile>) => {
        setParsingFiles((prev) =>
          prev.map((f) => (f.name === name ? { ...f, ...update } : f))
        );
      };

      try {
        updateFile(file.name, { stage: "uploading", progress: 15 });
        const filePath = `${veteran.id}/${activeCase.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("veteran-documents")
          .upload(filePath, file);

        if (uploadError) {
          updateFile(file.name, { stage: "error", progress: 0 });
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        updateFile(file.name, { stage: "scanning", progress: 35 });

        await supabase.from("documents").insert({
          case_id: activeCase.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          category: inferCategory(file.name),
          page_count: 0,
          processing_status: "ocr_processing",
          processing_progress: 35,
          uploaded_by: user.id,
        });

        await new Promise((r) => setTimeout(r, 800));
        updateFile(file.name, { stage: "extracting", progress: 60 });

        const analysisRes = await fetch("/api/ai/analyze-document", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filePath,
            caseId: activeCase.id,
            fileName: file.name,
          }),
        });

        updateFile(file.name, { stage: "indexing", progress: 85 });
        await new Promise((r) => setTimeout(r, 600));

        if (analysisRes.ok) {
          const data = await analysisRes.json();
          updateFile(file.name, {
            stage: "complete",
            progress: 100,
            conditionsFound: data.conditions_found || 0,
            snippetsFound: data.snippets_extracted || 0,
          });
          toast.success(
            `${file.name} analyzed — ${data.conditions_found || 0} condition(s) found.`
          );
        } else {
          updateFile(file.name, {
            stage: "complete",
            progress: 100,
            conditionsFound: 0,
            snippetsFound: 0,
          });
          toast.success(`${file.name} uploaded.`);
        }
      } catch {
        updateFile(file.name, { stage: "error", progress: 0 });
        toast.error(`Error processing ${file.name}`);
      }
    }

    setUploading(false);
    router.refresh();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    await processFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/ai/veteran-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          veteranId: veteran.id,
          caseId: activeCase?.id,
          conditions: caseConditions.map((c) => c.name),
          history: chatMessages.slice(-10),
        }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I had trouble with that request. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageText.trim() || !activeCase || sendingMsg) return;
    setSendingMsg(true);
    const { data, error } = await supabase
      .from("case_messages")
      .insert({
        case_id: activeCase.id,
        sender_id: user.id,
        sender_type: "veteran",
        sender_name: `${veteran.first_name} ${veteran.last_name}`,
        content: messageText.trim(),
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to send message");
    } else {
      setMsgList((prev) => [...prev, data as CaseMessage]);
      setMessageText("");
      toast.success("Message sent to your caseworker.");
    }
    setSendingMsg(false);
  }

  async function updateCaseMetrics() {
    if (!activeCase?.id || !veteran?.id) return;
    const { data: allTasks } = await supabase
      .from("veteran_tasks")
      .select("status")
      .eq("veteran_id", veteran.id as string);
    const { data: allDocs } = await supabase
      .from("documents")
      .select("id")
      .eq("case_id", activeCase.id as string);
    const total = allTasks?.length || 1;
    const completed = allTasks?.filter((t) => t.status === "completed").length || 0;
    const intakePercent = Math.round((completed / total) * 100);
    const docCount = allDocs?.length || 0;
    const citationPercent = Math.min(100, Math.round((docCount / 3) * 100));
    const readiness = Math.round(intakePercent * 0.6 + citationPercent * 0.4);
    const newStatus =
      completed === total && docCount >= 2
        ? "intake_complete"
        : completed > 0
        ? "intake_in_progress"
        : "intake_pending";
    await supabase
      .from("cases")
      .update({
        packet_readiness_score: readiness,
        intake_completeness: intakePercent,
        citation_coverage: citationPercent,
        status: newStatus,
      })
      .eq("id", activeCase.id as string);
  }

  async function handleCompleteTask(taskId: string) {
    const { error } = await supabase
      .from("veteran_tasks")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) {
      toast.error("Failed to mark task complete");
    } else {
      toast.success("Task marked complete.");
      await updateCaseMetrics();
      router.refresh();
    }
  }

  async function handleAiDraftStatement() {
    if (aiDrafting) return;
    setAiDrafting(true);
    try {
      const conditionNames = caseConditions.map((c) => c.name as string);
      const res = await fetch("/api/ai/veteran-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please write a full personal statement draft for my VA disability claim. My conditions are: ${conditionNames.join(", ")}. My branch of service was ${veteran.branch_of_service || "the military"}. Include how these conditions began during service, how they have impacted my daily life, and a strong closing statement. Write it in first person as if I am the veteran.`,
          veteranId: veteran.id,
          caseId: activeCase?.id,
          conditions: conditionNames,
          history: [],
        }),
      });
      const data = await res.json();
      if (data.response) setStatementDraft(data.response);
    } catch {
      toast.error("Failed to generate draft.");
    } finally {
      setAiDrafting(false);
    }
  }

  async function handleSwSend(input?: string) {
    const msg = (input || swInput).trim();
    if (!msg || swLoading) return;
    const newHistory = [...swHistory, { role: "user", content: msg }];
    setSwHistory(newHistory);
    setSwInput("");
    setSwLoading(true);
    try {
      const res = await fetch("/api/ai/statement-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: newHistory,
          conditions: caseConditions.map((c) => c.name as string),
          veteranName: `${veteran.first_name} ${veteran.last_name}`,
          branch: veteran.branch_of_service,
        }),
      });
      const data = await res.json();
      if (data.message)
        setSwHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      if (data.statement) setSwStatement(data.statement);
    } catch {
      toast.error("Failed to get response");
    }
    setSwLoading(false);
  }

  async function startStatementWriter() {
    setSwOpen(true);
    setSwHistory([]);
    setSwStatement("");
    setSwLoading(true);
    try {
      const res = await fetch("/api/ai/statement-writer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [],
          conditions: caseConditions.map((c) => c.name as string),
          veteranName: `${veteran.first_name} ${veteran.last_name}`,
          branch: veteran.branch_of_service,
        }),
      });
      const data = await res.json();
      if (data.message)
        setSwHistory([{ role: "assistant", content: data.message }]);
    } catch {
      toast.error("Failed to start interview");
    }
    setSwLoading(false);
  }

  async function handleExamPrep(condName: string, condId: string) {
    if (examPrepLoading) return;
    setExamPrepLoading(condId);
    try {
      const res = await fetch("/api/ai/cp-exam-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionName: condName,
          conditionId: condId,
          caseId: activeCase?.id,
        }),
      });
      const data = await res.json();
      if (data.prep) {
        setExamPrep((prev) => ({ ...prev, [condId]: data.prep }));
        setExpandedPrep(condId);
        toast.success("Exam prep guide ready");
      }
    } catch {
      toast.error("Failed to generate prep guide");
    }
    setExamPrepLoading(null);
  }

  async function handleEstimateRating() {
    if (ratingLoading || !activeCase) return;
    setRatingLoading(true);
    try {
      const res = await fetch("/api/ai/rating-estimator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: activeCase.id }),
      });
      const data = await res.json();
      if (data.estimated_combined_rating !== undefined) {
        setRatingData(data);
        toast.success("Rating estimate ready");
      }
    } catch {
      toast.error("Failed to estimate rating");
    }
    setRatingLoading(false);
  }

  async function handleGenerateBuddyStatement() {
    if (buddyLoading) return;
    setBuddyLoading(true);
    try {
      const res = await fetch("/api/ai/buddy-statement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veteranName: `${veteran.first_name} ${veteran.last_name}`,
          branch: veteran.branch_of_service,
          serviceStart: veteran.service_start_date,
          serviceEnd: veteran.service_end_date,
          conditions: caseConditions.map((c) => c.name as string),
          buddyName: buddyName || undefined,
          buddyRelationship: buddyRelationship || undefined,
          specificEvents: buddyEvents || undefined,
        }),
      });
      const data = await res.json();
      if (data.statement) {
        setBuddyStatement(data.statement);
        toast.success("Buddy statement generated");
      }
    } catch {
      toast.error("Failed to generate buddy statement");
    }
    setBuddyLoading(false);
  }

  async function handleEvidenceScorecard() {
    if (evidenceLoading || !activeCase) return;
    setEvidenceLoading(true);
    try {
      const res = await fetch("/api/ai/evidence-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: activeCase.id }),
      });
      const data = await res.json();
      if (data.conditions) {
        setEvidenceScorecard(data);
        toast.success("Evidence scorecard ready");
      }
    } catch {
      toast.error("Failed to generate scorecard");
    }
    setEvidenceLoading(false);
  }

  async function handleSubmitStatement() {
    if (!statementDraft.trim() || !activeCase || statementSaving) return;
    setStatementSaving(true);
    try {
      const fileName = `Personal_Statement_${new Date().toISOString().split("T")[0]}.txt`;
      const { error: docError } = await supabase.from("documents").insert({
        case_id: activeCase.id,
        file_name: fileName,
        file_path: `statements/${activeCase.id}/${Date.now()}_${fileName}`,
        file_size: new Blob([statementDraft]).size,
        mime_type: "text/plain",
        category: "personal_statement",
        page_count: 1,
        processing_status: "complete",
        processing_progress: 100,
        ocr_text: statementDraft,
        uploaded_by: user.id,
      });
      if (docError) {
        toast.error(`Failed to save: ${docError.message}`);
        setStatementSaving(false);
        return;
      }
      const statementTask = pendingTasks.find(
        (t) => t.task_type === "provide_statement"
      );
      if (statementTask) {
        await supabase
          .from("veteran_tasks")
          .update({ status: "completed", completed_at: new Date().toISOString() })
          .eq("id", statementTask.id);
      }
      toast.success("Personal statement submitted.");
      setStatementOpen(false);
      setStatementDraft("");
      await updateCaseMetrics();
      router.refresh();
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setStatementSaving(false);
    }
  }

  const unreadMsgCount = msgList.filter(
    (m) => m.sender_type === "staff" && !m.read_at
  ).length;

  return (
    <div className="vp-shell">
      {/* ── Global styles scoped to this component ── */}
      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

          :root {
            --obsidian: #080c12;
            --ink: #0d1420;
            --surface: #111927;
            --surface-2: #162032;
            --border: rgba(255,255,255,0.07);
            --border-bright: rgba(255,255,255,0.13);
            --gold: #d4a843;
            --gold-bright: #f0c958;
            --gold-dim: rgba(212,168,67,0.18);
            --green: #3ecf8e;
            --green-dim: rgba(62,207,142,0.15);
            --blue: #4da6ff;
            --blue-dim: rgba(77,166,255,0.12);
            --red: #f56565;
            --red-dim: rgba(245,101,101,0.1);
            --text: #cdd5e0;
            --text-dim: rgba(205,213,224,0.45);
            --text-ghost: rgba(205,213,224,0.22);
            --mono: 'IBM Plex Mono', monospace;
            --body: 'Barlow', sans-serif;
            --cond: 'Barlow Condensed', sans-serif;
            --display: 'Bebas Neue', sans-serif;
          }

          * { box-sizing: border-box; }

          .vp-shell {
            min-height: 100svh;
            background: var(--obsidian);
            color: var(--text);
            font-family: var(--body);
            position: relative;
            overflow-x: hidden;
          }

          /* Atmospheric grid background */
          .vp-shell::before {
            content: '';
            position: fixed;
            inset: 0;
            background-image:
              linear-gradient(rgba(212,168,67,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(212,168,67,0.025) 1px, transparent 1px);
            background-size: 48px 48px;
            pointer-events: none;
            z-index: 0;
          }

          /* Radial vignette */
          .vp-shell::after {
            content: '';
            position: fixed;
            inset: 0;
            background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,168,67,0.06) 0%, transparent 70%),
                        radial-gradient(ellipse 60% 40% at 0% 100%, rgba(77,166,255,0.04) 0%, transparent 60%);
            pointer-events: none;
            z-index: 0;
          }

          .vp-syne { font-family: var(--display); letter-spacing: 0.04em; }

          /* ─── HEADER ─── */
          .vp-header {
            position: sticky;
            top: 0;
            z-index: 50;
            background: rgba(8,12,18,0.92);
            backdrop-filter: blur(20px) saturate(1.4);
            border-bottom: 1px solid var(--border);
          }

          .vp-header-inner {
            max-width: 1140px;
            margin: 0 auto;
            padding: 0 1.5rem;
            height: 58px;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          .vp-logo {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .vp-logo-icon {
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-bright) 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 18px rgba(212,168,67,0.3);
            flex-shrink: 0;
          }

          .vp-logo-text {
            font-family: var(--display);
            font-size: 20px;
            letter-spacing: 0.08em;
            color: var(--text);
            line-height: 1;
          }

          .vp-logo-sub {
            font-family: var(--mono);
            font-size: 9px;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: var(--gold);
            opacity: 0.7;
            margin-top: 1px;
          }

          .vp-header-right {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .vp-vet-name {
            font-family: var(--mono);
            font-size: 11px;
            color: var(--text-dim);
            letter-spacing: 0.08em;
          }

          /* Status ping dot */
          .vp-status-ping {
            display: flex;
            align-items: center;
            gap: 6px;
            font-family: var(--mono);
            font-size: 10px;
            color: var(--green);
            letter-spacing: 0.06em;
          }
          .vp-ping-dot {
            width: 7px; height: 7px;
            border-radius: 50%;
            background: var(--green);
            box-shadow: 0 0 8px var(--green);
            animation: ping 2s ease infinite;
          }
          @keyframes ping {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.85); }
          }

          .vp-signout-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 14px;
            border-radius: 4px;
            border: 1px solid var(--border-bright);
            background: transparent;
            color: var(--text-dim);
            font-family: var(--mono);
            font-size: 11px;
            letter-spacing: 0.06em;
            cursor: pointer;
            transition: all 0.15s;
          }
          .vp-signout-btn:hover {
            background: rgba(255,255,255,0.05);
            color: var(--text);
            border-color: rgba(255,255,255,0.2);
          }

          /* ─── TAB NAV ─── */
          .vp-tabnav {
            background: rgba(8,12,18,0.75);
            border-bottom: 1px solid var(--border);
            position: sticky;
            top: 58px;
            z-index: 40;
            backdrop-filter: blur(16px);
          }

          .vp-tabnav-inner {
            max-width: 1140px;
            margin: 0 auto;
            padding: 0 1.5rem;
            display: flex;
            gap: 0;
            overflow-x: auto;
            scrollbar-width: none;
          }
          .vp-tabnav-inner::-webkit-scrollbar { display: none; }

          .vp-tab {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 14px 18px;
            font-family: var(--cond);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-ghost);
            border-bottom: 2px solid transparent;
            background: transparent;
            cursor: pointer;
            transition: all 0.15s;
            white-space: nowrap;
            border-radius: 0;
            position: relative;
          }
          .vp-tab:hover { color: var(--text-dim); }
          .vp-tab.active {
            color: var(--gold-bright);
            border-bottom-color: var(--gold);
          }
          .vp-tab.active::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 50%;
            transform: translateX(-50%);
            width: 40%;
            height: 2px;
            background: var(--gold-bright);
            filter: blur(4px);
          }

          .vp-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 17px;
            height: 17px;
            padding: 0 4px;
            border-radius: 3px;
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 600;
            background: var(--gold);
            color: var(--obsidian);
          }

          /* ─── MAIN CONTENT ─── */
          .vp-main {
            max-width: 1140px;
            margin: 0 auto;
            padding: 2rem 1.5rem;
            position: relative;
            z-index: 1;
          }

          /* ─── CARDS ─── */
          .vp-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            overflow: hidden;
            transition: border-color 0.2s, box-shadow 0.2s;
            position: relative;
          }
          .vp-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(212,168,67,0.2), transparent);
            pointer-events: none;
          }
          .vp-card:hover {
            border-color: var(--border-bright);
            box-shadow: 0 4px 24px rgba(0,0,0,0.3);
          }

          .vp-card-header {
            padding: 1.1rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(0,0,0,0.15);
          }

          .vp-card-title {
            font-family: var(--cond);
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--text);
          }

          .vp-card-body { padding: 1.25rem 1.5rem; }

          /* ─── STATUS PILLS ─── */
          .vp-status-pill {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 3px 9px;
            border-radius: 3px;
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
          }
          .vp-status-draft { background: rgba(212,168,67,0.12); color: var(--gold-bright); border: 1px solid rgba(212,168,67,0.25); }
          .vp-status-review { background: rgba(77,166,255,0.1); color: var(--blue); border: 1px solid rgba(77,166,255,0.2); }
          .vp-status-approved { background: var(--green-dim); color: var(--green); border: 1px solid rgba(62,207,142,0.25); }
          .vp-status-pending { background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid var(--border); }

          /* ─── PROGRESS PIPELINE ─── */
          .vp-progress-steps {
            display: flex;
            gap: 3px;
            margin-bottom: 2.5rem;
          }
          .vp-step {
            flex: 1;
            height: 2px;
            background: rgba(255,255,255,0.07);
            transition: background 0.5s ease;
            position: relative;
          }
          .vp-step.done { background: var(--gold); }
          .vp-step.done::after {
            content: '';
            position: absolute;
            inset: -1px;
            background: var(--gold);
            filter: blur(3px);
            opacity: 0.5;
          }
          .vp-step-label {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            font-family: var(--mono);
            font-size: 8px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            white-space: nowrap;
            color: var(--text-ghost);
          }
          .vp-step.done .vp-step-label { color: var(--gold); }

          /* ─── SCORE RING ─── */
          .vp-score-ring {
            position: relative;
            width: 96px;
            height: 96px;
            flex-shrink: 0;
          }
          .vp-score-ring svg { transform: rotate(-90deg); }
          .vp-score-ring-inner {
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .vp-score-value {
            font-family: var(--display);
            font-size: 28px;
            letter-spacing: 0.04em;
            color: var(--gold-bright);
            line-height: 1;
          }
          .vp-score-label {
            font-family: var(--mono);
            font-size: 8px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--text-ghost);
            margin-top: 2px;
          }

          /* ─── ALERT BANNERS ─── */
          .vp-alert {
            padding: 14px 18px;
            border-radius: 6px;
            display: flex;
            align-items: flex-start;
            gap: 14px;
            border-left: 3px solid;
            border-top: 1px solid;
            border-right: 1px solid;
            border-bottom: 1px solid;
          }
          .vp-alert-amber {
            background: rgba(212,168,67,0.06);
            border-left-color: var(--gold);
            border-top-color: rgba(212,168,67,0.18);
            border-right-color: rgba(212,168,67,0.1);
            border-bottom-color: rgba(212,168,67,0.1);
          }
          .vp-alert-red {
            background: var(--red-dim);
            border-left-color: var(--red);
            border-top-color: rgba(245,101,101,0.18);
            border-right-color: rgba(245,101,101,0.1);
            border-bottom-color: rgba(245,101,101,0.1);
          }

          /* ─── CONDITION CARDS ─── */
          .vp-condition {
            padding: 16px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.02);
            transition: all 0.15s;
            position: relative;
            overflow: hidden;
          }
          .vp-condition::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 3px;
            background: var(--gold);
            opacity: 0;
            transition: opacity 0.15s;
          }
          .vp-condition:hover {
            border-color: var(--border-bright);
            background: rgba(255,255,255,0.035);
          }
          .vp-condition:hover::before { opacity: 1; }

          .vp-progress-bar {
            height: 3px;
            border-radius: 0;
            background: rgba(255,255,255,0.06);
            overflow: hidden;
          }
          .vp-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--gold), var(--gold-bright));
            transition: width 1s ease;
            position: relative;
          }
          .vp-progress-fill::after {
            content: '';
            position: absolute;
            right: 0; top: 0; bottom: 0;
            width: 20px;
            background: var(--gold-bright);
            filter: blur(6px);
            opacity: 0.7;
          }

          /* ─── TASK ITEMS ─── */
          .vp-task {
            padding: 18px;
            border-radius: 6px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.02);
            display: flex;
            gap: 16px;
            align-items: flex-start;
            transition: all 0.15s;
            position: relative;
            overflow: hidden;
          }
          .vp-task::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 1px;
            background: linear-gradient(90deg, var(--gold), transparent);
            opacity: 0;
            transition: opacity 0.15s;
          }
          .vp-task:hover {
            border-color: var(--border-bright);
            background: rgba(255,255,255,0.035);
          }
          .vp-task:hover::after { opacity: 0.5; }

          .vp-task-icon {
            width: 38px;
            height: 38px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          /* ─── BUTTONS ─── */
          .vp-btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 18px;
            border-radius: 4px;
            font-family: var(--cond);
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            cursor: pointer;
            border: none;
            transition: all 0.15s;
          }
          .vp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

          .vp-btn-gold {
            background: linear-gradient(135deg, var(--gold) 0%, var(--gold-bright) 100%);
            color: var(--obsidian);
            box-shadow: 0 2px 12px rgba(212,168,67,0.25);
          }
          .vp-btn-gold:hover:not(:disabled) {
            filter: brightness(1.1);
            box-shadow: 0 4px 20px rgba(212,168,67,0.4);
            transform: translateY(-1px);
          }

          .vp-btn-ghost {
            background: rgba(255,255,255,0.05);
            color: var(--text-dim);
            border: 1px solid var(--border-bright);
          }
          .vp-btn-ghost:hover:not(:disabled) {
            background: rgba(255,255,255,0.09);
            color: var(--text);
            border-color: rgba(255,255,255,0.22);
          }

          .vp-btn-outline {
            background: transparent;
            color: var(--gold-bright);
            border: 1px solid rgba(212,168,67,0.35);
          }
          .vp-btn-outline:hover:not(:disabled) {
            background: var(--gold-dim);
            border-color: rgba(212,168,67,0.55);
          }

          .vp-btn-danger {
            background: var(--red-dim);
            color: var(--red);
            border: 1px solid rgba(245,101,101,0.2);
          }

          .vp-btn-sm {
            padding: 5px 12px;
            font-size: 11px;
            border-radius: 3px;
          }

          /* ─── DROP ZONE ─── */
          .vp-dropzone {
            border: 1px dashed rgba(212,168,67,0.2);
            border-radius: 6px;
            background: rgba(212,168,67,0.02);
            padding: 3rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            position: relative;
            overflow: hidden;
          }
          .vp-dropzone::before {
            content: '';
            position: absolute;
            inset: 0;
            background: repeating-linear-gradient(
              45deg,
              transparent,
              transparent 8px,
              rgba(212,168,67,0.015) 8px,
              rgba(212,168,67,0.015) 9px
            );
            pointer-events: none;
          }
          .vp-dropzone:hover {
            border-color: rgba(212,168,67,0.45);
            background: rgba(212,168,67,0.04);
          }
          .vp-dropzone.dragging {
            border-color: var(--gold);
            border-style: solid;
            background: rgba(212,168,67,0.07);
            box-shadow: inset 0 0 30px rgba(212,168,67,0.06), 0 0 0 3px rgba(212,168,67,0.1);
            transform: scale(1.008);
          }
          .vp-dropzone.processing {
            border-color: rgba(77,166,255,0.3);
            border-style: solid;
            background: rgba(77,166,255,0.03);
            cursor: default;
          }

          .vp-drop-icon {
            width: 60px;
            height: 60px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(212,168,67,0.08);
            border: 1px solid rgba(212,168,67,0.2);
            margin-bottom: 4px;
          }

          /* ─── PARSE CARDS ─── */
          .vp-parse-card {
            border-radius: 6px;
            padding: 14px 16px;
            border: 1px solid var(--border);
            transition: all 0.25s;
          }
          .vp-parse-card.complete { border-color: rgba(62,207,142,0.3); background: var(--green-dim); }
          .vp-parse-card.error { border-color: rgba(245,101,101,0.25); background: var(--red-dim); }
          .vp-parse-card.processing { border-color: rgba(77,166,255,0.2); background: var(--blue-dim); }

          .vp-parse-progress {
            height: 2px;
            background: rgba(255,255,255,0.06);
            overflow: hidden;
            margin-top: 10px;
          }
          .vp-parse-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--blue), #93c5fd);
            transition: width 0.5s ease;
          }
          .vp-parse-progress-fill.done {
            background: linear-gradient(90deg, var(--green), #6ee7b7);
          }

          /* ─── CHAT ─── */
          .vp-chat-container {
            display: flex;
            flex-direction: column;
            height: calc(100svh - 190px);
            min-height: 520px;
          }

          .vp-chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 16px;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.08) transparent;
          }

          .vp-chat-bubble {
            max-width: 80%;
            padding: 12px 18px;
            font-size: 14px;
            line-height: 1.65;
            font-family: var(--body);
          }
          .vp-chat-bubble.user {
            background: linear-gradient(135deg, var(--gold), var(--gold-bright));
            color: var(--obsidian);
            margin-left: auto;
            border-radius: 8px 8px 2px 8px;
            font-weight: 500;
          }
          .vp-chat-bubble.assistant {
            background: var(--surface-2);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 2px 8px 8px 8px;
            border-left: 2px solid var(--gold);
          }

          .vp-chat-input-row {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 10px;
            align-items: flex-end;
            background: rgba(0,0,0,0.15);
          }

          .vp-input {
            flex: 1;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 10px 14px;
            font-size: 14px;
            font-family: var(--body);
            color: var(--text);
            outline: none;
            transition: border-color 0.15s, background 0.15s;
            resize: none;
          }
          .vp-input::placeholder { color: var(--text-ghost); }
          .vp-input:focus {
            border-color: rgba(212,168,67,0.4);
            background: rgba(255,255,255,0.06);
          }

          /* ─── MESSAGE BUBBLES ─── */
          .vp-msg-bubble {
            max-width: 75%;
            padding: 12px 16px;
            font-size: 14px;
            line-height: 1.65;
          }
          .vp-msg-bubble.veteran {
            background: linear-gradient(135deg, var(--gold), var(--gold-bright));
            color: var(--obsidian);
            margin-left: auto;
            border-radius: 8px 8px 2px 8px;
            font-weight: 500;
          }
          .vp-msg-bubble.staff {
            background: var(--surface-2);
            color: var(--text);
            border: 1px solid var(--border);
            border-left: 2px solid var(--blue);
            border-radius: 2px 8px 8px 8px;
          }

          /* ─── DIVIDERS ─── */
          .vp-divider {
            height: 1px;
            background: var(--border);
            margin: 0.5rem 0;
          }

          /* ─── SECTION LABELS ─── */
          .vp-section-label {
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--gold);
            opacity: 0.65;
            margin-bottom: 1rem;
          }

          /* ─── RATING DISPLAY ─── */
          .vp-rating-hero {
            text-align: center;
            padding: 3rem 1.5rem;
            position: relative;
          }
          .vp-rating-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse 60% 50% at 50% 50%, rgba(212,168,67,0.06) 0%, transparent 70%);
            pointer-events: none;
          }
          .vp-rating-number {
            font-family: var(--display);
            font-size: 96px;
            letter-spacing: 0.04em;
            line-height: 0.9;
            background: linear-gradient(135deg, var(--gold), var(--gold-bright) 50%, #fff8d6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            filter: drop-shadow(0 0 30px rgba(212,168,67,0.3));
          }
          .vp-rating-label {
            font-family: var(--mono);
            font-size: 11px;
            color: var(--text-ghost);
            letter-spacing: 0.18em;
            text-transform: uppercase;
            margin-top: 6px;
          }

          /* ─── CHIPS ─── */
          .vp-chip {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 3px;
            font-family: var(--mono);
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.06em;
          }
          .vp-chip-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(62,207,142,0.25); }
          .vp-chip-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(77,166,255,0.22); }
          .vp-chip-amber { background: var(--gold-dim); color: var(--gold-bright); border: 1px solid rgba(212,168,67,0.25); }
          .vp-chip-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(245,101,101,0.2); }
          .vp-chip-gray { background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid var(--border); }

          /* ─── MODAL ─── */
          .vp-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 100;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            backdrop-filter: blur(6px);
          }
          .vp-modal {
            background: var(--ink);
            border: 1px solid var(--border-bright);
            border-radius: 8px;
            width: 100%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 30px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,168,67,0.06);
          }
          .vp-modal-header {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            background: rgba(0,0,0,0.2);
          }
          .vp-modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 1.5rem;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.08) transparent;
          }
          .vp-modal-footer {
            padding: 1.25rem 1.5rem;
            border-top: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            background: rgba(0,0,0,0.2);
          }

          .vp-textarea {
            width: 100%;
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 14px;
            font-size: 14px;
            line-height: 1.7;
            color: var(--text);
            outline: none;
            font-family: var(--body);
            resize: vertical;
            min-height: 280px;
            transition: border-color 0.15s;
          }
          .vp-textarea::placeholder { color: var(--text-ghost); }
          .vp-textarea:focus { border-color: rgba(212,168,67,0.35); }

          /* ─── COMPLETED TASK ─── */
          .vp-task-done {
            padding: 12px 16px;
            border-radius: 4px;
            background: rgba(62,207,142,0.04);
            border: 1px solid rgba(62,207,142,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
          }

          /* ─── EXAM PREP ─── */
          .vp-expand-section {
            border-top: 1px solid var(--border);
            padding: 1.5rem;
            background: rgba(0,0,0,0.1);
            animation: slideDown 0.2s ease;
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* ─── ANIMATIONS ─── */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes pulse-dot {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
          }
          .vp-pulse { animation: pulse-dot 1.4s ease-in-out infinite; }

          @keyframes scanline {
            from { transform: translateY(-100%); }
            to { transform: translateY(100%); }
          }
          .vp-scanning::after {
            content: '';
            position: absolute;
            left: 0; right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--blue), transparent);
            animation: scanline 1.5s ease-in-out infinite;
            pointer-events: none;
          }

          /* ─── PROMPT CHIPS ─── */
          .vp-prompt-chip {
            display: inline-flex;
            align-items: center;
            padding: 6px 14px;
            border-radius: 3px;
            font-family: var(--cond);
            font-size: 12px;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            white-space: nowrap;
            cursor: pointer;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.03);
            color: var(--text-dim);
            transition: all 0.15s;
          }
          .vp-prompt-chip:hover {
            background: var(--gold-dim);
            border-color: rgba(212,168,67,0.3);
            color: var(--gold-bright);
          }

          /* ─── SCROLLBARS ─── */
          .vp-scroll::-webkit-scrollbar { width: 3px; }
          .vp-scroll::-webkit-scrollbar-track { background: transparent; }
          .vp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 1px; }

          /* ─── DOC ITEMS ─── */
          .vp-doc-item {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 12px 14px;
            border-radius: 4px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.02);
            transition: all 0.15s;
          }
          .vp-doc-item:hover {
            border-color: var(--border-bright);
            background: rgba(255,255,255,0.04);
          }

          /* ─── STAT GRID ─── */
          .vp-stat-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1px;
            background: var(--border);
            border-radius: 4px;
            overflow: hidden;
          }
          .vp-stat {
            background: var(--surface-2);
            padding: 1.1rem 1rem;
            text-align: center;
          }
          .vp-stat-value {
            font-family: var(--display);
            font-size: 28px;
            letter-spacing: 0.04em;
            color: var(--text);
            line-height: 1;
          }
          .vp-stat-label {
            font-family: var(--mono);
            font-size: 9px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--text-ghost);
            margin-top: 4px;
          }

          /* ─── MONO DATA LABELS ─── */
          .vp-mono { font-family: var(--mono); }
          .vp-label {
            font-family: var(--mono);
            font-size: 10px;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--text-ghost);
          }

          /* ─── RESPONSIVE ─── */
          @media (max-width: 640px) {
            .vp-main { padding: 1.25rem 1rem; }
            .vp-chat-container { height: calc(100svh - 230px); }
            .vp-header-inner { padding: 0 1rem; }
            .vp-tabnav-inner { padding: 0 1rem; }
          }
        `}</style>

      {/* ── Header ── */}
      <header className="vp-header">
        <div className="vp-header-inner">
          <div className="vp-logo">
            <div className="vp-logo-icon">
              <Shield size={18} color="#080c12" strokeWidth={2.5} />
            </div>
            <div>
              <div className="vp-logo-text">ClearClaim</div>
              <div className="vp-logo-sub">Veteran Portal</div>
            </div>
          </div>
          <div className="vp-header-right">
            <div className="vp-status-ping hidden sm:flex">
              <div className="vp-ping-dot" />
              <span>SECURE</span>
            </div>
            <span className="vp-vet-name hidden sm:block">
              {(veteran.first_name as string).toUpperCase()} {(veteran.last_name as string).toUpperCase()}
            </span>
            <button className="vp-signout-btn" onClick={handleSignOut}>
              <LogOut size={12} />
              <span>EXIT</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab Nav ── */}
      <nav className="vp-tabnav">
        <div className="vp-tabnav-inner">
          {TAB_CONFIG.map((t) => {
            const count =
              t.key === "tasks"
                ? pendingTasks.length
                : t.key === "messages"
                ? unreadMsgCount
                : t.key === "documents"
                ? documents.length
                : undefined;
            return (
              <button
                key={t.key}
                className={`vp-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.short}</span>
                {count !== undefined && count > 0 && (
                  <span className="vp-badge">{count}</span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="vp-main">

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Hero case card */}
            {activeCase && (
              <div className="vp-card">
                <div className="vp-card-header">
                  <div>
                    <div className="vp-section-label" style={{ marginBottom: "4px" }}>Active Case</div>
                    <div className="vp-card-title vp-syne">
                      Case #{activeCase.case_number as string}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span className={`vp-status-pill vp-status-${activeCase.status === "review" ? "review" : activeCase.status === "ready_for_export" ? "approved" : "pending"}`}>
                      {String(activeCase.status).replace(/_/g, " ")}
                    </span>
                  </div>
                </div>

                <div className="vp-card-body">
                  {/* Progress steps */}
                  <div style={{ marginBottom: "2.5rem" }}>
                    <div className="vp-progress-steps">
                      {STATUS_STEPS.map((step, i) => (
                        <div
                          key={step.key}
                          className={`vp-step${i <= currentStepIndex ? " done" : ""}`}
                        >
                          <span className="vp-step-label">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Score + stats grid */}
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    {/* Ring */}
                    <div className="vp-score-ring">
                      <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                        <circle
                          cx="45" cy="45" r="38"
                          fill="none"
                          stroke="url(#goldGrad)"
                          strokeWidth="7"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 38}`}
                          strokeDashoffset={`${2 * Math.PI * 38 * (1 - (activeCase.packet_readiness_score as number) / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease" }}
                        />
                        <defs>
                          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#c9a84c" />
                            <stop offset="100%" stopColor="#f0d070" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="vp-score-ring-inner">
                        <div className="vp-score-value">{activeCase.packet_readiness_score as number}%</div>
                        <div className="vp-score-label">Ready</div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div className="vp-stat-grid">
                        <div className="vp-stat">
                          <div className="vp-stat-value">{caseConditions.length}</div>
                          <div className="vp-stat-label">Conditions</div>
                        </div>
                        <div className="vp-stat">
                          <div className="vp-stat-value">{documents.length}</div>
                          <div className="vp-stat-label">Documents</div>
                        </div>
                        <div className="vp-stat">
                          <div className="vp-stat-value">{pendingTasks.length}</div>
                          <div className="vp-stat-label">Tasks Due</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Urgent tasks alert */}
            {pendingTasks.length > 0 && (
              <div className="vp-alert vp-alert-amber">
                <AlertTriangle size={16} color="#f0d070" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#f0d070", fontSize: "14px", marginBottom: "4px" }}>
                    {pendingTasks.length} action item{pendingTasks.length > 1 ? "s" : ""} need your attention
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
                    Completing these tasks helps move your claim forward.
                  </div>
                </div>
                <button
                  className="vp-btn vp-btn-outline vp-btn-sm"
                  onClick={() => setTab("tasks")}
                  style={{ flexShrink: 0 }}
                >
                  View <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Conditions */}
            <div className="vp-card">
              <div className="vp-card-header">
                <div className="vp-card-title vp-syne">Claimed Conditions</div>
                <span className="vp-chip vp-chip-gray">{caseConditions.length} total</span>
              </div>
              <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {caseConditions.length > 0 ? (
                  caseConditions.map((cond) => {
                    const condGaps = gaps.filter((g) => g.condition_id === cond.id);
                    const supported = condGaps.filter((g) => g.gap_status === "supported").length;
                    const total = condGaps.length || 1;
                    const pct = Math.round((supported / total) * 100);
                    const condStatus = cond.status as string;

                    return (
                      <div key={cond.id as string} className="vp-condition">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8eaf0" }}>
                            {cond.name as string}
                          </div>
                          <span className={`vp-status-pill vp-status-${condStatus === "approved" ? "approved" : condStatus === "draft" ? "draft" : "pending"}`}>
                            {condStatus}
                          </span>
                        </div>
                        {!!cond.ai_summary && (
                            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginBottom: "10px", lineHeight: "1.6" }}>
                              {String(cond.ai_summary)}
                            </p>
                          )}
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div className="vp-progress-bar" style={{ flex: 1 }}>
                            <div className="vp-progress-fill" style={{ width: `${pct}%` }} />
                          </div>
                          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>
                            {pct}% evidence
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.3)", fontSize: "14px" }}>
                    No conditions identified yet. Upload your medical records to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ TASKS ══ */}
        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="vp-card">
              <div className="vp-card-header">
                <div className="vp-card-title vp-syne">
                  Pending Action Items
                </div>
                <span className="vp-chip vp-chip-amber">{pendingTasks.length} due</span>
              </div>
              <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pendingTasks.length > 0 ? (
                  (pendingTasks as Record<string, unknown>[]).map((task) => (
                    <div key={task.id as string} className="vp-task">
                      <div
                        className="vp-task-icon"
                        style={{
                          background:
                            task.task_type === "upload"
                              ? "rgba(99,179,237,0.12)"
                              : task.task_type === "provide_statement"
                              ? "rgba(167,139,250,0.12)"
                              : "rgba(201,168,76,0.12)",
                        }}
                      >
                        {task.task_type === "upload" ? (
                          <Upload size={16} color="#90cdf4" />
                        ) : task.task_type === "provide_statement" ? (
                          <FileText size={16} color="#b794f4" />
                        ) : (
                          <MessageSquare size={16} color="#f0d070" />
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: "14px", color: "#e8eaf0" }}>
                            {task.title as string}
                          </span>
                          {!!task.due_date && (
                            <span className="vp-chip vp-chip-gray">
                              <Clock size={10} />
                              Due {new Date(task.due_date as string).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)", marginBottom: "12px", lineHeight: "1.5" }}>
                          {task.description as string}
                        </p>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {task.task_type === "upload" && (
                            <button
                              className="vp-btn vp-btn-gold vp-btn-sm"
                              onClick={() => setTab("documents")}
                            >
                              <Upload size={12} /> Upload Now
                            </button>
                          )}
                          {task.task_type === "provide_statement" && (
                            <>
                              <button
                                className="vp-btn vp-btn-gold vp-btn-sm"
                                onClick={() => startStatementWriter()}
                              >
                                <Brain size={12} /> Guided Interview
                              </button>
                              <button
                                className="vp-btn vp-btn-ghost vp-btn-sm"
                                onClick={() => setStatementOpen(true)}
                              >
                                <Sparkles size={12} /> Quick Draft
                              </button>
                            </>
                          )}
                          <button
                            className="vp-btn vp-btn-ghost vp-btn-sm"
                            onClick={() => handleCompleteTask(task.id as string)}
                          >
                            <CheckCircle2 size={12} /> Mark Done
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.3)" }}>
                    <CheckCircle2 size={36} style={{ margin: "0 auto 12px", color: "#68d391" }} />
                    <div style={{ fontWeight: 600, color: "#68d391", marginBottom: "4px" }}>All caught up</div>
                    <div style={{ fontSize: "13px" }}>No pending tasks right now.</div>
                  </div>
                )}
              </div>
            </div>

            {completedTasks.length > 0 && (
              <div className="vp-card">
                <div className="vp-card-header">
                  <div className="vp-card-title vp-syne">Completed</div>
                  <span className="vp-chip vp-chip-green">{completedTasks.length}</span>
                </div>
                <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {completedTasks.map((task) => (
                    <div key={task.id as string} className="vp-task-done">
                      <CheckCircle2 size={16} color="#68d391" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textDecoration: "line-through" }}>
                        {task.title as string}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ DOCUMENTS ══ */}
        {tab === "documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Statement CTA */}
            <div className="vp-card" style={{ background: "rgba(201,168,76,0.06)", borderColor: "rgba(201,168,76,0.2)" }}>
              <div className="vp-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f0d070", fontSize: "14px", marginBottom: "4px", fontFamily: "'Syne', sans-serif" }}>
                    Personal Statement
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.4)" }}>
                    Write your own or let AI draft one based on your conditions.
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="vp-btn vp-btn-gold vp-btn-sm" onClick={() => setStatementOpen(true)}>
                    <PenLine size={12} /> Quick Write
                  </button>
                  <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={() => startStatementWriter()}>
                    <Brain size={12} /> Guided Interview
                  </button>
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div
              ref={dropZoneRef}
              className={`vp-dropzone${isDragging ? " dragging" : uploading ? " processing" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              {isDragging ? (
                <>
                  <div className="vp-drop-icon" style={{ animation: "pulse-dot 0.8s ease infinite" }}>
                    <CloudUpload size={24} color="#f0d070" />
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: "#f0d070" }}>
                    Release to upload
                  </div>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>AI will analyze instantly</div>
                </>
              ) : uploading ? (
                <>
                  <div className="vp-drop-icon" style={{ background: "rgba(99,179,237,0.12)", borderColor: "rgba(99,179,237,0.25)" }}>
                    <ScanLine size={24} color="#90cdf4" className="vp-pulse" />
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: "#90cdf4" }}>
                    AI analyzing documents...
                  </div>
                </>
              ) : (
                <>
                  <div className="vp-drop-icon">
                    <CloudUpload size={24} color="#c9a84c" />
                  </div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "15px", color: "#e8eaf0" }}>
                    Drag & drop files here
                  </div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>or click to browse</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px", padding: "6px 14px", borderRadius: "8px", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)" }}>
                    <Zap size={12} color="#f0d070" />
                    <span style={{ fontSize: "11px", color: "#f0d070", fontWeight: 600, letterSpacing: "0.04em" }}>
                      AI extracts conditions & evidence automatically
                    </span>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.tiff,.doc,.docx"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </div>

            {/* Parsing progress */}
            {parsingFiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
                    Document Processing
                  </div>
                  {parsingFiles.every((f) => f.stage === "complete" || f.stage === "error") && (
                    <button
                      onClick={() => setParsingFiles([])}
                      style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", cursor: "pointer", background: "none", border: "none" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {parsingFiles.map((file, i) => (
                  <div key={i} className={`vp-parse-card ${file.stage === "complete" ? "complete" : file.stage === "error" ? "error" : "processing"}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: file.stage === "complete" ? "rgba(72,187,120,0.12)" : file.stage === "error" ? "rgba(245,101,101,0.12)" : "rgba(99,179,237,0.1)"
                      }}>
                        {file.stage === "complete" ? <CheckSquare size={16} color="#68d391" /> :
                         file.stage === "error" ? <X size={16} color="#fc8181" /> :
                         <ScanLine size={16} color="#90cdf4" className="vp-pulse" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: "13px", color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {file.name}
                        </div>
                        <div style={{ fontSize: "11px", marginTop: "2px", color: file.stage === "complete" ? "#68d391" : file.stage === "error" ? "#fc8181" : "#90cdf4" }}>
                          {file.stage === "uploading" ? "Uploading to secure storage..." :
                           file.stage === "scanning" ? "OCR scanning..." :
                           file.stage === "extracting" ? "AI extracting conditions & evidence..." :
                           file.stage === "indexing" ? "Indexing to your case..." :
                           file.stage === "complete" ? "Analysis complete" : "Upload failed"}
                        </div>
                      </div>
                      {file.stage === "complete" && (
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          {(file.conditionsFound ?? 0) > 0 && (
                            <span className="vp-chip vp-chip-green">
                              <FilePlus size={10} /> {file.conditionsFound}
                            </span>
                          )}
                          {(file.snippetsFound ?? 0) > 0 && (
                            <span className="vp-chip vp-chip-blue">{file.snippetsFound} evidence</span>
                          )}
                        </div>
                      )}
                    </div>
                    {file.stage !== "error" && (
                      <div className="vp-parse-progress">
                        <div className={`vp-parse-progress-fill${file.stage === "complete" ? " done" : ""}`} style={{ width: `${file.progress}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Missing docs */}
            {missingGaps.length > 0 && (
              <div className="vp-alert vp-alert-red">
                <AlertTriangle size={15} color="#fc8181" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontWeight: 600, color: "#fc8181", fontSize: "13px", marginBottom: "6px" }}>
                    Missing Documents
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {missingGaps.map((gap) => (
                      <div key={gap.id as string} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "rgba(255,255,255,0.45)" }}>
                        <X size={11} color="#fc8181" />
                        {gap.description as string || gap.category_name as string}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Document list */}
            <div className="vp-card">
              <div className="vp-card-header">
                <div className="vp-card-title vp-syne">Uploaded Documents</div>
                <span className="vp-chip vp-chip-gray">{documents.length}</span>
              </div>
              <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id as string} className="vp-doc-item">
                      <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "rgba(99,179,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileText size={15} color="#90cdf4" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500, fontSize: "13px", color: "#e8eaf0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {doc.file_name as string}
                        </div>
                        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                          {doc.category as string} · {formatFileSize(doc.file_size as number)}
                        </div>
                      </div>
                      <span className={`vp-chip ${doc.processing_status === "complete" ? "vp-chip-green" : doc.processing_status === "error" ? "vp-chip-red" : "vp-chip-amber"}`}>
                        {doc.processing_status === "complete" ? "Analyzed" : doc.processing_status === "error" ? "Error" : "Processing"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "2rem", color: "rgba(255,255,255,0.25)", fontSize: "13px" }}>
                    No documents uploaded yet. Drop your files above to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══ AI ASSISTANT ══ */}
        {tab === "assistant" && (
          <div className="vp-card vp-chat-container">
            <div className="vp-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(240,208,112,0.1))", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={15} color="#f0d070" />
                </div>
                <div>
                  <div className="vp-card-title vp-syne">AI Claims Assistant</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "1px" }}>Powered by Gemini 3.0</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="vp-chat-messages vp-scroll">
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div className={`vp-chat-bubble ${msg.role}`}>
                    {msg.role === "assistant" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                        <Sparkles size={11} color="#c9a84c" />
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c9a84c" }}>
                          ClearClaim AI
                        </span>
                      </div>
                    )}
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                    {msg.role === "assistant" && i > 0 && msg.content.length > 100 && (
                      <div style={{ display: "flex", gap: "12px", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                        <button
                          onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied"); }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "rgba(255,255,255,0.35)", cursor: "pointer", background: "none", border: "none" }}
                        >
                          <Copy size={11} /> Copy
                        </button>
                        <button
                          onClick={() => { setStatementDraft((prev) => prev ? prev + "\n\n" + msg.content : msg.content); setStatementOpen(true); toast.success("Sent to Statement Editor"); }}
                          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#c9a84c", cursor: "pointer", background: "none", border: "none", fontWeight: 600 }}
                        >
                          <PenLine size={11} /> Use as Statement
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div className="vp-chat-bubble assistant" style={{ display: "flex", gap: "4px", alignItems: "center", padding: "14px 18px" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            <div style={{ padding: "10px 1.25rem", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "8px", overflowX: "auto" }}>
              {[
                "Draft my personal statement",
                "What documents do I need?",
                "Explain the C&P exam",
                "What is a nexus letter?",
              ].map((p) => (
                <button key={p} className="vp-prompt-chip" onClick={() => setChatInput(p)}>
                  {p}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleChat} className="vp-chat-input-row">
              <input
                className="vp-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your claim..."
                disabled={chatLoading}
              />
              <button
                type="submit"
                className="vp-btn vp-btn-gold"
                disabled={chatLoading || !chatInput.trim()}
                style={{ padding: "10px 16px" }}
              >
                {chatLoading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
              </button>
            </form>
          </div>
        )}

        {/* ══ C&P EXAM PREP ══ */}
        {tab === "exam-prep" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="vp-card" style={{ background: "rgba(167,139,250,0.05)", borderColor: "rgba(167,139,250,0.2)" }}>
              <div className="vp-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Stethoscope size={20} color="#b794f4" />
                  </div>
                  <div>
                    <div className="vp-card-title vp-syne">C&P Exam Preparation</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      Know what to expect and how to accurately describe your symptoms.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {caseConditions.length === 0 ? (
              <div className="vp-card">
                <div className="vp-card-body" style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.25)" }}>
                  <Stethoscope size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p>Upload medical records first to identify conditions.</p>
                </div>
              </div>
            ) : (
              caseConditions.map((cond) => {
                const condId = cond.id as string;
                const condName = cond.name as string;
                const prep = examPrep[condId];
                const isExpanded = expandedPrep === condId;

                return (
                  <div key={condId} className="vp-card">
                    <div className="vp-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(167,139,250,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Stethoscope size={17} color="#b794f4" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8eaf0" }}>{condName}</div>
                          <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                            {prep ? "Guide ready" : "Generate your personalized prep guide"}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {!prep ? (
                          <button
                            className="vp-btn vp-btn-ghost vp-btn-sm"
                            onClick={() => handleExamPrep(condName, condId)}
                            disabled={examPrepLoading !== null}
                            style={{ borderColor: "rgba(167,139,250,0.3)", color: "#b794f4" }}
                          >
                            {examPrepLoading === condId ? (
                              <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                            ) : (
                              <><Brain size={12} /> Generate Guide</>
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => setExpandedPrep(isExpanded ? null : condId)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex" }}
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        )}
                      </div>
                    </div>

                    {prep && isExpanded && (
                      <div className="vp-expand-section" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {!!prep.what_to_expect && (
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#90cdf4", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                              What to Expect
                            </div>
                            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", lineHeight: "1.7" }}>{prep.what_to_expect as string}</p>
                          </div>
                        )}
                        {Array.isArray(prep.key_questions) && prep.key_questions.length > 0 && (
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#b794f4", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                              Questions They&apos;ll Ask
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {(prep.key_questions as string[]).map((q, i) => (
                                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                                  <ArrowRight size={12} color="#b794f4" style={{ flexShrink: 0, marginTop: "3px" }} />
                                  {q}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(prep.tips) && prep.tips.length > 0 && (
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#68d391", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                              Tips for Accuracy
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {(prep.tips as string[]).map((t, i) => (
                                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                                  <CheckCircle2 size={12} color="#68d391" style={{ flexShrink: 0, marginTop: "3px" }} />
                                  {t}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(prep.common_mistakes) && prep.common_mistakes.length > 0 && (
                          <div style={{ background: "rgba(245,101,101,0.07)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(245,101,101,0.15)" }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fc8181", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                              Common Mistakes to Avoid
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {(prep.common_mistakes as string[]).map((m, i) => (
                                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(255,128,128,0.7)" }}>
                                  <X size={11} color="#fc8181" style={{ flexShrink: 0, marginTop: "3px" }} />
                                  {m}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {Array.isArray(prep.what_to_bring) && prep.what_to_bring.length > 0 && (
                          <div>
                            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f0d070", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                              What to Bring
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {(prep.what_to_bring as string[]).map((b, i) => (
                                <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(255,255,255,0.55)" }}>
                                  <ChevronRight size={12} color="#c9a84c" style={{ flexShrink: 0, marginTop: "3px" }} />
                                  {b}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!!prep.important_note && (
                          <div style={{ background: "rgba(99,179,237,0.07)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(99,179,237,0.15)" }}>
                            <span style={{ fontSize: "13px", color: "#90cdf4" }}>
                              <strong>Note: </strong>{prep.important_note as string}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ══ RATING ESTIMATE ══ */}
        {tab === "rating" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="vp-card" style={{ background: "rgba(72,187,120,0.04)", borderColor: "rgba(72,187,120,0.18)" }}>
              <div className="vp-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(72,187,120,0.12)", border: "1px solid rgba(72,187,120,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <TrendingUp size={20} color="#68d391" />
                  </div>
                  <div>
                    <div className="vp-card-title vp-syne">AI Rating Estimator</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      Estimate based on conditions & evidence strength.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!ratingData && (
              <div className="vp-card">
                <div className="vp-card-body" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <button
                    className="vp-btn vp-btn-gold"
                    onClick={handleEstimateRating}
                    disabled={ratingLoading}
                    style={{ padding: "12px 28px", fontSize: "15px" }}
                  >
                    {ratingLoading ? (
                      <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Analyzing Evidence...</>
                    ) : (
                      <><Brain size={18} /> Estimate My Rating</>
                    )}
                  </button>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "12px" }}>
                    For informational purposes only. Actual ratings determined by the VA.
                  </div>
                </div>
              </div>
            )}

            {ratingData && (
              <>
                <div className="vp-card">
                  <div className="vp-rating-hero">
                    <div style={{ fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                      Estimated Combined Rating
                    </div>
                    <div className="vp-rating-number">{ratingData.estimated_combined_rating as number}%</div>
                    <div className="vp-rating-label">{ratingData.confidence as string} confidence</div>
                      {!!ratingData.va_math_explanation && (
                      <div style={{ marginTop: "16px", display: "inline-block", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 18px", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{ratingData.va_math_explanation as string}</span>
                      </div>
                    )}
                    <div style={{ marginTop: "20px" }}>
                      <button
                        className="vp-btn vp-btn-ghost vp-btn-sm"
                        onClick={handleEstimateRating}
                        disabled={ratingLoading}
                      >
                        {ratingLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Brain size={12} />}
                        Recalculate
                      </button>
                    </div>
                  </div>
                </div>

                {Array.isArray(ratingData.individual_ratings) && (ratingData.individual_ratings as Record<string, unknown>[]).map((r, i) => (
                  <div key={i} className="vp-card">
                    <div className="vp-card-body">
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px", gap: "12px" }}>
                        <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8eaf0", flex: 1 }}>{r.condition as string}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                          <span className={`vp-chip ${r.evidence_strength === "strong" ? "vp-chip-green" : r.evidence_strength === "moderate" ? "vp-chip-amber" : "vp-chip-red"}`}>
                            {r.evidence_strength as string}
                          </span>
                          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "22px", color: "#f0d070" }}>
                            {r.estimated_rating as number}%
                          </span>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>{r.rationale as string}</p>
                      {Array.isArray(r.key_factors) && (r.key_factors as string[]).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                          {(r.key_factors as string[]).map((f, j) => (
                            <span key={j} className="vp-chip vp-chip-gray">{f}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {Array.isArray(ratingData.improvement_opportunities) && (ratingData.improvement_opportunities as Record<string, unknown>[]).length > 0 && (
                  <div className="vp-card" style={{ borderColor: "rgba(201,168,76,0.2)", background: "rgba(201,168,76,0.04)" }}>
                    <div className="vp-card-header">
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Sparkles size={16} color="#f0d070" />
                        <div className="vp-card-title vp-syne">How to Improve Your Rating</div>
                      </div>
                    </div>
                    <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(ratingData.improvement_opportunities as Record<string, unknown>[]).map((opp, i) => (
                        <div key={i} style={{ padding: "14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.12)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 600, fontSize: "13px", color: "#e8eaf0" }}>{opp.condition as string}</span>
                            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
                              {opp.current_estimated as number}% → {opp.potential_rating as number}%
                            </span>
                          </div>
                          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" }}>{opp.what_would_help as string}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ratingData.disclaimer && (
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", textAlign: "center", fontStyle: "italic" }}>
                    {ratingData.disclaimer as string}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ BUDDY STATEMENT ══ */}
        {tab === "buddy" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Intro card */}
            <div className="vp-card" style={{ background: "rgba(77,166,255,0.04)", borderColor: "rgba(77,166,255,0.18)" }}>
              <div className="vp-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(77,166,255,0.12)", border: "1px solid rgba(77,166,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Users size={20} color="#4da6ff" />
                  </div>
                  <div>
                    <div className="vp-card-title vp-syne">Buddy Statement Generator</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      Generate a template buddy/lay statement for a fellow service member, friend, or family member to customize and sign.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="vp-card">
              <div className="vp-card-header">
                <div className="vp-card-title vp-syne">Statement Details</div>
              </div>
              <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <div className="vp-label" style={{ marginBottom: "6px" }}>Buddy&apos;s Name</div>
                    <input
                      className="vp-input"
                      value={buddyName}
                      onChange={(e) => setBuddyName(e.target.value)}
                      placeholder="e.g., SGT John Smith"
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <div className="vp-label" style={{ marginBottom: "6px" }}>Relationship</div>
                    <input
                      className="vp-input"
                      value={buddyRelationship}
                      onChange={(e) => setBuddyRelationship(e.target.value)}
                      placeholder="e.g., Fellow platoon member"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
                <div>
                  <div className="vp-label" style={{ marginBottom: "6px" }}>Specific Events or Details (Optional)</div>
                  <textarea
                    className="vp-input"
                    value={buddyEvents}
                    onChange={(e) => setBuddyEvents(e.target.value)}
                    placeholder="Describe any specific incidents, deployments, or observations you want the statement to reference..."
                    rows={3}
                    style={{ width: "100%", resize: "vertical", fontFamily: "var(--body)" }}
                  />
                </div>

                {/* Conditions being claimed */}
                {caseConditions.length > 0 && (
                  <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "6px", padding: "12px", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div className="vp-label" style={{ marginBottom: "8px" }}>Conditions Referenced</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {caseConditions.map((c) => (
                        <span key={c.id as string} className="vp-chip vp-chip-amber">{c.name as string}</span>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  className="vp-btn vp-btn-gold"
                  onClick={handleGenerateBuddyStatement}
                  disabled={buddyLoading}
                  style={{ alignSelf: "flex-start" }}
                >
                  {buddyLoading ? (
                    <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating...</>
                  ) : (
                    <><Brain size={14} /> Generate Statement</>
                  )}
                </button>
              </div>
            </div>

            {/* Generated statement */}
            {buddyStatement && (
              <div className="vp-card">
                <div className="vp-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CheckCircle2 size={14} color="#3ecf8e" />
                    <div className="vp-card-title vp-syne">Generated Buddy Statement</div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="vp-btn vp-btn-ghost vp-btn-sm"
                      onClick={() => { navigator.clipboard.writeText(buddyStatement); toast.success("Copied to clipboard"); }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                    <button
                      className="vp-btn vp-btn-outline vp-btn-sm"
                      onClick={handleGenerateBuddyStatement}
                      disabled={buddyLoading}
                    >
                      <Brain size={12} /> Regenerate
                    </button>
                  </div>
                </div>
                <div className="vp-card-body">
                  <div style={{
                    background: "rgba(255,255,255,0.03)",
                    borderRadius: "6px",
                    padding: "20px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    fontSize: "14px",
                    lineHeight: "1.8",
                    color: "rgba(255,255,255,0.6)",
                    whiteSpace: "pre-wrap",
                    fontFamily: "var(--body)",
                  }}>
                    {buddyStatement}
                  </div>
                  <div style={{ marginTop: "14px", padding: "10px 14px", borderRadius: "4px", background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)", display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <AlertTriangle size={14} color="#f0c958" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                      This is an AI-generated template. Share it with your buddy to review, customize with their own words and specific memories, then sign and date. The statement should be in their own voice.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ EVIDENCE CHECK ══ */}
        {tab === "evidence" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Intro */}
            <div className="vp-card" style={{ background: "rgba(62,207,142,0.04)", borderColor: "rgba(62,207,142,0.18)" }}>
              <div className="vp-card-body">
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(62,207,142,0.12)", border: "1px solid rgba(62,207,142,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldCheck size={20} color="#3ecf8e" />
                  </div>
                  <div>
                    <div className="vp-card-title vp-syne">Evidence Sufficiency Check</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>
                      AI analyzes what evidence you have vs. what&apos;s needed for each condition.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!evidenceScorecard ? (
              <div className="vp-card">
                <div className="vp-card-body" style={{ textAlign: "center", padding: "2.5rem" }}>
                  <button
                    className="vp-btn vp-btn-gold"
                    onClick={handleEvidenceScorecard}
                    disabled={evidenceLoading}
                    style={{ padding: "12px 28px", fontSize: "15px" }}
                  >
                    {evidenceLoading ? (
                      <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Analyzing Evidence...</>
                    ) : (
                      <><SearchIcon size={18} /> Run Evidence Check</>
                    )}
                  </button>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "12px" }}>
                    Evaluates your evidence against VA requirements for each claimed condition.
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Overall readiness */}
                <div className="vp-card">
                  <div className="vp-card-body" style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.5rem" }}>
                    <div className="vp-score-ring">
                      <svg width="90" height="90" viewBox="0 0 90 90">
                        <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                        <circle
                          cx="45" cy="45" r="38" fill="none"
                          stroke="url(#evidGrad)"
                          strokeWidth="7" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 38}`}
                          strokeDashoffset={`${2 * Math.PI * 38 * (1 - ((evidenceScorecard as Record<string, unknown>).overallReadiness as number) / 100)}`}
                          style={{ transition: "stroke-dashoffset 1s ease", transform: "rotate(-90deg)", transformOrigin: "center" }}
                        />
                        <defs>
                          <linearGradient id="evidGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#3ecf8e" />
                            <stop offset="100%" stopColor="#6ee7b7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="vp-score-ring-inner">
                        <div className="vp-score-value" style={{ color: "#3ecf8e" }}>
                          {(evidenceScorecard as Record<string, unknown>).overallReadiness as number}%
                        </div>
                        <div className="vp-score-label">Evidence</div>
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "16px", color: "#e8eaf0", marginBottom: "8px" }}>
                        Evidence Readiness Score
                      </div>
                      {Array.isArray((evidenceScorecard as Record<string, unknown>).topActions) && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {((evidenceScorecard as Record<string, unknown>).topActions as string[]).map((action, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
                              <ArrowRight size={12} color="#3ecf8e" style={{ flexShrink: 0, marginTop: "3px" }} />
                              {action}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Per-condition scorecards */}
                {Array.isArray((evidenceScorecard as Record<string, unknown>).conditions) &&
                  ((evidenceScorecard as Record<string, unknown>).conditions as Array<Record<string, unknown>>).map((cond) => (
                    <div key={cond.conditionId as string} className="vp-card">
                      <div className="vp-card-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ fontWeight: 600, fontSize: "14px", color: "#e8eaf0" }}>{cond.conditionName as string}</div>
                          <span className={`vp-chip ${(cond.overallScore as number) >= 70 ? "vp-chip-green" : (cond.overallScore as number) >= 40 ? "vp-chip-amber" : "vp-chip-red"}`}>
                            {cond.overallScore as number}%
                          </span>
                        </div>
                      </div>
                      <div className="vp-card-body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {Array.isArray(cond.evidenceTypes) && (cond.evidenceTypes as Array<Record<string, unknown>>).map((ev, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "4px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: ev.status === "present" ? "rgba(62,207,142,0.12)" : ev.status === "partial" ? "rgba(212,168,67,0.12)" : "rgba(245,101,101,0.12)" }}>
                              {ev.status === "present" ? <CheckCircle2 size={14} color="#3ecf8e" /> :
                               ev.status === "partial" ? <CircleDot size={14} color="#f0c958" /> :
                               <X size={14} color="#f56565" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontSize: "13px", fontWeight: 500, color: "#e8eaf0" }}>{ev.label as string}</span>
                                <span className={`vp-chip ${ev.priority === "critical" ? "vp-chip-red" : ev.priority === "important" ? "vp-chip-amber" : "vp-chip-gray"}`} style={{ fontSize: "9px" }}>
                                  {ev.priority as string}
                                </span>
                              </div>
                              {ev.details ? (
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{String(ev.details)}</div>
                              ) : null}
                            </div>
                            <span className={`vp-chip ${ev.status === "present" ? "vp-chip-green" : ev.status === "partial" ? "vp-chip-amber" : "vp-chip-red"}`}>
                              {ev.status as string}
                            </span>
                          </div>
                        ))}
                        {cond.recommendation ? (
                          <div style={{ marginTop: "4px", padding: "10px 12px", borderRadius: "4px", background: "rgba(212,168,67,0.06)", borderLeft: "3px solid rgba(212,168,67,0.4)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <Sparkles size={12} color="#f0c958" />
                              <span className="vp-mono" style={{ fontSize: "10px", fontWeight: 600, color: "#f0c958", letterSpacing: "0.08em" }}>TOP PRIORITY</span>
                            </div>
                            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{String(cond.recommendation)}</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))
                }

                <div style={{ textAlign: "center" }}>
                  <button
                    className="vp-btn vp-btn-ghost"
                    onClick={handleEvidenceScorecard}
                    disabled={evidenceLoading}
                  >
                    {evidenceLoading ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <ClipboardCheck size={12} />}
                    Refresh Scorecard
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ══ MESSAGES ══ */}
        {tab === "messages" && (
          <div className="vp-card" style={{ display: "flex", flexDirection: "column", height: "calc(100svh - 200px)", minHeight: "500px" }}>
            <div className="vp-card-header">
              <div className="vp-card-title vp-syne">Messages with Your Caseworker</div>
              {unreadMsgCount > 0 && (
                <span className="vp-badge">{unreadMsgCount} new</span>
              )}
            </div>
            <div className="vp-chat-messages vp-scroll" style={{ flex: 1 }}>
              {msgList.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.2)", gap: "10px" }}>
                  <MessageSquare size={36} style={{ opacity: 0.3 }} />
                  <span style={{ fontSize: "13px" }}>No messages yet. Say hello to your caseworker.</span>
                </div>
              ) : (
                msgList.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender_type === "veteran" ? "flex-end" : "flex-start" }}>
                    <div className={`vp-msg-bubble ${msg.sender_type === "veteran" ? "veteran" : "staff"}`}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: msg.sender_type === "veteran" ? "rgba(10,15,26,0.6)" : "rgba(255,255,255,0.4)" }}>
                          {msg.sender_name}
                        </span>
                        <span style={{ fontSize: "10px", color: msg.sender_type === "veteran" ? "rgba(10,15,26,0.4)" : "rgba(255,255,255,0.25)" }}>
                          {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p style={{ fontSize: "14px", whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleSendMessage} className="vp-chat-input-row">
              <textarea
                className="vp-input vp-scroll"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                style={{ resize: "none" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                className="vp-btn vp-btn-gold"
                disabled={!messageText.trim() || sendingMsg}
                style={{ padding: "10px 16px", alignSelf: "flex-end" }}
              >
                {sendingMsg ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ══ PERSONAL STATEMENT MODAL ══ */}
      {statementOpen && (
        <div className="vp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setStatementOpen(false)}>
          <div className="vp-modal" style={{ maxWidth: "740px" }}>
            <div className="vp-modal-header">
              <div>
                <div className="vp-card-title vp-syne">Personal Statement</div>
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)", marginTop: "3px" }}>
                  Write or AI-draft your statement, then submit.
                </div>
              </div>
              <button onClick={() => setStatementOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="vp-modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <button
                  className="vp-btn vp-btn-outline vp-btn-sm"
                  onClick={handleAiDraftStatement}
                  disabled={aiDrafting}
                >
                  {aiDrafting ? (
                    <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Drafting...</>
                  ) : (
                    <><Sparkles size={13} /> Generate AI Draft</>
                  )}
                </button>
                <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>
                  AI drafts based on your conditions. Edit before submitting.
                </span>
              </div>

              {caseConditions.length > 0 && (
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "12px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "8px", fontFamily: "'DM Sans', sans-serif" }}>
                    Your claimed conditions
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {caseConditions.map((c) => (
                      <span key={c.id as string} className="vp-chip vp-chip-gray">{c.name as string}</span>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                className="vp-textarea vp-scroll"
                value={statementDraft}
                onChange={(e) => setStatementDraft(e.target.value)}
                placeholder="Write your personal statement here. Describe how your conditions began during military service, how they have affected your daily life, work, and relationships, and why you believe they are connected to your service..."
              />
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)" }}>
                {statementDraft.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            </div>

            <div className="vp-modal-footer">
              <button className="vp-btn vp-btn-ghost vp-btn-sm" onClick={() => setStatementOpen(false)}>
                Cancel
              </button>
              <button
                className="vp-btn vp-btn-gold"
                onClick={handleSubmitStatement}
                disabled={!statementDraft.trim() || statementSaving}
              >
                {statementSaving ? (
                  <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting...</>
                ) : (
                  <><Send size={15} /> Submit Statement</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ STATEMENT WRITER MODAL ══ */}
      {swOpen && (
        <div className="vp-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setSwOpen(false)}>
          <div className="vp-modal" style={{ maxWidth: "640px" }}>
            <div className="vp-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "9px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={18} color="#f0d070" />
                </div>
                <div>
                  <div className="vp-card-title vp-syne">AI Statement Interview</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "2px" }}>
                    Answer a few questions — AI writes your statement
                  </div>
                </div>
              </div>
              <button onClick={() => setSwOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                <X size={20} />
              </button>
            </div>

            <div className="vp-modal-body vp-scroll" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {swHistory.map((msg, i) => (
                <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div className={`vp-chat-bubble ${msg.role === "user" ? "user" : "assistant"}`} style={{ maxWidth: "85%" }}>
                    {msg.role === "assistant" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" }}>
                        <Brain size={10} color="#c9a84c" />
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#c9a84c" }}>AI Writer</span>
                      </div>
                    )}
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              {swLoading && (
                <div style={{ display: "flex" }}>
                  <div className="vp-chat-bubble assistant" style={{ padding: "14px 18px" }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", margin: "0 2px", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {swStatement ? (
              <div className="vp-modal-footer" style={{ flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "rgba(72,187,120,0.08)", borderRadius: "10px", padding: "14px", border: "1px solid rgba(72,187,120,0.2)", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <CheckCircle2 size={14} color="#68d391" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#68d391" }}>Your statement is ready</span>
                  </div>
                  <div style={{ maxHeight: "120px", overflowY: "auto", fontSize: "13px", color: "rgba(255,255,255,0.5)", lineHeight: "1.6", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "10px" }} className="vp-scroll">
                    {swStatement}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <button
                    className="vp-btn vp-btn-ghost"
                    style={{ flex: 1 }}
                    onClick={() => { navigator.clipboard.writeText(swStatement); toast.success("Copied"); }}
                  >
                    <Copy size={14} /> Copy
                  </button>
                  <button
                    className="vp-btn vp-btn-gold"
                    style={{ flex: 1 }}
                    onClick={() => { setStatementDraft(swStatement); setSwOpen(false); setStatementOpen(true); }}
                  >
                    <PenLine size={14} /> Edit & Submit
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); handleSwSend(); }}
                className="vp-chat-input-row"
              >
                <input
                  className="vp-input"
                  value={swInput}
                  onChange={(e) => setSwInput(e.target.value)}
                  placeholder="Type your answer..."
                  disabled={swLoading}
                />
                <button
                  type="submit"
                  className="vp-btn vp-btn-gold"
                  disabled={swLoading || !swInput.trim()}
                  style={{ padding: "10px 16px" }}
                >
                  {swLoading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Unused import reference suppression */}
      {false && <span><Eye size={0} /><Menu size={0} /><Users size={0} /><ShieldCheck size={0} /><CircleDot size={0} /><ClipboardCheck size={0} /><SearchIcon size={0} /></span>}
    </div>
  );
}

function inferCategory(fileName: string): string {
  const lower = fileName.toLowerCase();
  if (lower.includes("dd214") || lower.includes("dd-214") || lower.includes("discharge")) return "str";
  if (lower.includes("nexus") || lower.includes("civilian") || lower.includes("private")) return "civilian_notes";
  if (lower.includes("statement") || lower.includes("personal")) return "personal_statement";
  if (lower.includes("buddy") || lower.includes("peer")) return "buddy_statement";
  if (lower.includes("imaging") || lower.includes("xray") || lower.includes("x-ray") || lower.includes("mri") || lower.includes("ct_scan")) return "imaging";
  if (lower.includes("med_list") || lower.includes("medications") || lower.includes("rx")) return "meds_list";
  if (lower.includes("va") || lower.includes("vamc") || lower.includes("treatment") || lower.includes("medical") || lower.includes("record") || lower.includes("str") || lower.includes("audiol") || lower.includes("psych") || lower.includes("neuro")) return "va_notes";
  return "other";
}

function formatFileSize(bytes: number): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
