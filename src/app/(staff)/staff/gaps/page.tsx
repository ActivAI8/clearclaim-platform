"use client";

import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Send,
  Plus,
  Upload,
  MessageSquare,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type GapStatus = "supported" | "partial" | "missing";
interface GapItem { id: string; condition: string; category: string; status: GapStatus; description: string; sources?: string[]; }
interface CaseOption { id: string; case_number: string; veteran_name: string; }

const statusIcons = {
  supported: <CheckCircle2 className="h-4 w-4" style={{ color: "#3ecf8e" }} />,
  partial: <AlertCircle className="h-4 w-4" style={{ color: "#f0c958" }} />,
  missing: <XCircle className="h-4 w-4" style={{ color: "#f56565" }} />,
};
const statusBg: Record<GapStatus, string> = {
  supported: "rgba(62,207,142,0.06)",
  partial: "rgba(212,168,67,0.06)",
  missing: "rgba(245,101,101,0.06)",
};
const statusBorder: Record<GapStatus, string> = {
  supported: "rgba(62,207,142,0.15)",
  partial: "rgba(212,168,67,0.15)",
  missing: "rgba(245,101,101,0.15)",
};

const STYLES = `
  .gp-shell { padding: 1.5rem; font-family: 'Barlow', sans-serif; color: #cdd5e0; min-height: 100%; }
  .gp-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 0.06em; color: #cdd5e0; line-height: 1; }
  .gp-subtitle { font-size: 13px; color: rgba(205,213,224,0.45); margin-top: 4px; }
  .gp-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.6); outline: none; cursor: pointer; min-width: 260px; }
  .gp-select option { background: #0d1420; color: #cdd5e0; }
  .gp-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; color: rgba(205,213,224,0.6); cursor: pointer; transition: all 0.15s; }
  .gp-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .gp-btn-primary { background: linear-gradient(135deg, #d4a843, #f0c958); color: #080c12; font-weight: 600; border: none; }
  .gp-btn-primary:hover { opacity: 0.9; color: #080c12; }
  .gp-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .gp-card { background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 1.25rem 1.5rem; position: relative; overflow: hidden; margin-bottom: 1.5rem; }
  .gp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent); pointer-events: none; }
  .gp-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd5e0; margin-bottom: 1rem; }
  .gp-filter-btn { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.12s; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); color: rgba(205,213,224,0.5); }
  .gp-filter-btn.active { background: rgba(212,168,67,0.15); color: #f0c958; border-color: rgba(212,168,67,0.3); }
  .gp-filter-btn:hover:not(.active) { background: rgba(255,255,255,0.06); color: #cdd5e0; }
  .gp-gap-row { border-radius: 4px; padding: 12px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
  .gp-gap-category { font-size: 13px; font-weight: 500; color: #cdd5e0; }
  .gp-gap-desc { font-size: 12px; color: rgba(205,213,224,0.5); margin-top: 4px; }
  .gp-gap-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 2px; color: rgba(205,213,224,0.5); letter-spacing: 0.06em; }
  .gp-gap-source { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; background: rgba(77,166,255,0.08); border: 1px solid rgba(77,166,255,0.15); border-radius: 2px; color: #4da6ff; cursor: pointer; display: flex; align-items: center; gap: 3px; }
  .gp-task-card { border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 12px; margin-bottom: 8px; }
  .gp-task-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gp-task-title { font-size: 13px; font-weight: 500; color: #cdd5e0; }
  .gp-task-desc { font-size: 12px; color: rgba(205,213,224,0.4); margin-top: 2px; }
  .gp-task-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
  .gp-task-badge-done { background: rgba(62,207,142,0.12); color: #3ecf8e; border: 1px solid rgba(62,207,142,0.2); }
  .gp-task-badge-sent { background: rgba(77,166,255,0.12); color: #4da6ff; border: 1px solid rgba(77,166,255,0.2); }
  .gp-task-badge-pending { background: rgba(255,255,255,0.06); color: rgba(205,213,224,0.5); border: 1px solid rgba(255,255,255,0.07); }
  .gp-stat-item { display: flex; align-items: center; gap: 6px; font-size: 13px; color: rgba(205,213,224,0.6); }
  .gp-empty { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.3); text-align: center; padding: 2rem; letter-spacing: 0.06em; }
  .gp-spinner { display: flex; align-items: center; justify-content: center; height: 24rem; }
  .gp-spin { width: 32px; height: 32px; border: 3px solid rgba(212,168,67,0.2); border-top-color: #d4a843; border-radius: 50%; animation: gpspin 0.7s linear infinite; }
  @keyframes gpspin { to { transform: rotate(360deg); } }
`;

export default function GapAnalyzerPage() {
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [gaps, setGaps] = useState<GapItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>("all");
  const [showTasks, setShowTasks] = useState(true);
  const [sendingBundle, setSendingBundle] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCases() {
      const { data } = await supabase.from("cases").select("id, case_number, veteran:veterans(first_name, last_name)").order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts = (data || []).map((c: any) => ({ id: c.id, case_number: c.case_number, veteran_name: c.veteran ? `${c.veteran.first_name} ${c.veteran.last_name}` : "Unknown" }));
      setCases(opts);
      if (opts.length > 0) setSelectedCaseId(opts[0].id);
      setLoading(false);
    }
    loadCases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCaseId) return;
    async function loadCaseData() {
      const [condRes, gapRes, taskRes] = await Promise.all([
        supabase.from("conditions").select("*").eq("case_id", selectedCaseId),
        supabase.from("evidence_gaps").select("*, condition:conditions(name)").eq("case_id", selectedCaseId),
        supabase.from("veteran_tasks").select("*").eq("case_id", selectedCaseId).order("created_at"),
      ]);
      setTasks(taskRes.data || []);
      const dbGaps = gapRes.data || [];
      if (dbGaps.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGaps(dbGaps.map((g: any) => ({ id: g.id, condition: g.condition?.name || "Unknown", category: g.category_name, status: g.gap_status as GapStatus, description: g.description || "", sources: [] })));
      } else {
        const conds = condRes.data || [];
        const syntheticGaps: GapItem[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        conds.forEach((cond: any) => {
          syntheticGaps.push(
            { id: `${cond.id}-diag`, condition: cond.name, category: "Diagnosis / Medical Records", status: cond.confidence >= 0.8 ? "supported" : "partial", description: cond.ai_summary || "Medical documentation for this condition." },
            { id: `${cond.id}-service`, condition: cond.name, category: "In-Service Occurrence", status: cond.status === "approved" ? "supported" : "partial", description: "Documentation of in-service event or onset." },
            { id: `${cond.id}-nexus`, condition: cond.name, category: "Nexus / Medical Opinion", status: cond.status === "approved" ? "partial" : "missing", description: "Medical opinion linking condition to military service." },
            { id: `${cond.id}-impact`, condition: cond.name, category: "Functional Impact", status: cond.confidence >= 0.85 ? "supported" : "missing", description: "Assessment of how condition affects daily functioning." },
          );
        });
        setGaps(syntheticGaps);
      }
    }
    loadCaseData();
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSendBundle() {
    if (!selectedCaseId || sendingBundle) return;
    setSendingBundle(true);
    const { data: caseData } = await supabase.from("cases").select("veteran_id").eq("id", selectedCaseId).single();
    if (!caseData) { setSendingBundle(false); return; }
    const actionableGaps = gaps.filter((g) => g.status === "missing" || g.status === "partial");
    const newTasks = actionableGaps.map((gap) => ({
      case_id: selectedCaseId, veteran_id: caseData.veteran_id,
      task_type: gap.category.includes("Nexus") ? "upload" : gap.category.includes("Impact") ? "answer_questions" : "upload",
      title: `${gap.category} - ${gap.condition}`, description: gap.description, status: "sent",
      due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    }));
    if (newTasks.length > 0) {
      const { error } = await supabase.from("veteran_tasks").insert(newTasks);
      if (error) toast.error("Failed to send task bundle");
      else { toast.success(`${newTasks.length} tasks sent to veteran`); const { data: updatedTasks } = await supabase.from("veteran_tasks").select("*").eq("case_id", selectedCaseId).order("created_at"); setTasks(updatedTasks || []); }
    } else toast.info("No gaps require veteran action");
    setSendingBundle(false);
  }

  const conditionNames = [...new Set(gaps.map((g) => g.condition))];
  const filtered = selectedCondition === "all" ? gaps : gaps.filter((g) => g.condition === selectedCondition);
  const summary = { supported: filtered.filter((g) => g.status === "supported").length, partial: filtered.filter((g) => g.status === "partial").length, missing: filtered.filter((g) => g.status === "missing").length };

  if (loading) return <div className="gp-shell"><style>{STYLES}</style><div className="gp-spinner"><div className="gp-spin" /></div></div>;

  return (
    <div className="gp-shell">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="gp-title">Gap Analyzer</div>
          <div className="gp-subtitle">Evidence coverage analysis and veteran task generation</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="gp-select" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} - {c.veteran_name}</option>)}
          </select>
          <button className="gp-btn" onClick={() => setShowTasks(!showTasks)}>{showTasks ? "Hide Tasks" : "Show Tasks"}</button>
          <button className={cn("gp-btn", "gp-btn-primary")} onClick={handleSendBundle} disabled={sendingBundle}>
            {sendingBundle ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Send Task Bundle
          </button>
        </div>
      </div>

      {/* Evidence Heatmap */}
      <div className="gp-card">
        <div className="gp-card-title">Evidence Heatmap</div>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button onClick={() => setSelectedCondition("all")} className={cn("gp-filter-btn", selectedCondition === "all" && "active")}>All Conditions</button>
          {conditionNames.map((cond) => (
            <button key={cond} onClick={() => setSelectedCondition(cond)} className={cn("gp-filter-btn", selectedCondition === cond && "active")}>{cond}</button>
          ))}
        </div>
        <div className="flex items-center gap-6 mb-4">
          <div className="gp-stat-item"><CheckCircle2 size={14} style={{ color: "#3ecf8e" }} />{summary.supported} Supported</div>
          <div className="gp-stat-item"><AlertCircle size={14} style={{ color: "#f0c958" }} />{summary.partial} Partial</div>
          <div className="gp-stat-item"><XCircle size={14} style={{ color: "#f56565" }} />{summary.missing} Missing</div>
        </div>
        {filtered.length === 0 ? (
          <div className="gp-empty">No gap analysis available. Process documents to generate gaps.</div>
        ) : (
          filtered.map((gap) => (
            <div key={gap.id} className="gp-gap-row" style={{ background: statusBg[gap.status], border: `1px solid ${statusBorder[gap.status]}` }}>
              {statusIcons[gap.status]}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="gp-gap-category">{gap.category}</span>
                  {selectedCondition === "all" && <span className="gp-gap-badge">{gap.condition}</span>}
                </div>
                <p className="gp-gap-desc">{gap.description}</p>
                {gap.sources && gap.sources.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    {gap.sources.map((src) => <span key={src} className="gp-gap-source"><FileText size={10} /> {src}</span>)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Tasks */}
      {showTasks && (
        <div className="gp-card">
          <div className="flex items-center justify-between mb-4">
            <div className="gp-card-title" style={{ marginBottom: 0 }}>Veteran Tasks ({tasks.length})</div>
            <button className="gp-btn"><Plus size={13} /> Add Task</button>
          </div>
          {tasks.length === 0 ? (
            <div className="gp-empty">No tasks yet. Use &ldquo;Send Task Bundle&rdquo; to generate tasks from gaps.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="gp-task-card">
                <div className="flex items-start gap-3">
                  <div className="gp-task-icon" style={{
                    background: task.task_type === "upload" ? "rgba(77,166,255,0.1)" : task.task_type === "answer_questions" ? "rgba(167,139,250,0.1)" : "rgba(251,146,60,0.1)"
                  }}>
                    {task.task_type === "upload" ? <Upload size={14} style={{ color: "#4da6ff" }} /> :
                     task.task_type === "answer_questions" ? <MessageSquare size={14} style={{ color: "#a78bfa" }} /> :
                     <Clock size={14} style={{ color: "#fb923c" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="gp-task-title">{task.title}</span>
                      <span className={cn("gp-task-badge",
                        task.status === "completed" ? "gp-task-badge-done" :
                        task.status === "sent" ? "gp-task-badge-sent" : "gp-task-badge-pending"
                      )}>{task.status}</span>
                    </div>
                    <p className="gp-task-desc">{task.description}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
