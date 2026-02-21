"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Case, CASE_STATUS_LABELS } from "@/lib/types";
import {
  Search,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  Upload,
  Zap,
  Shield,
  Filter,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

  :root {
    --obsidian: #080c12;
    --ink: #0d1420;
    --surface: #111927;
    --surface-2: #162032;
    --border: rgba(255,255,255,0.07);
    --border-bright: rgba(255,255,255,0.13);
    --gold: #d4a843;
    --gold-bright: #f0c958;
    --gold-dim: rgba(212,168,67,0.15);
    --green: #3ecf8e;
    --green-dim: rgba(62,207,142,0.13);
    --blue: #4da6ff;
    --blue-dim: rgba(77,166,255,0.12);
    --red: #f56565;
    --red-dim: rgba(245,101,101,0.1);
    --purple: #a78bfa;
    --text: #cdd5e0;
    --text-dim: rgba(205,213,224,0.45);
    --text-ghost: rgba(205,213,224,0.22);
    --mono: 'IBM Plex Mono', monospace;
    --body: 'Barlow', sans-serif;
    --cond: 'Barlow Condensed', sans-serif;
    --display: 'Bebas Neue', sans-serif;
  }

  .st-shell {
    min-height: 100vh;
    background: var(--obsidian);
    font-family: var(--body);
    color: var(--text);
    position: relative;
  }
  .st-shell::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(212,168,67,0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212,168,67,0.02) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
    z-index: 0;
  }
  .st-shell::after {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(212,168,67,0.05) 0%, transparent 65%),
                radial-gradient(ellipse 50% 40% at 100% 100%, rgba(77,166,255,0.03) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .st-content { position: relative; z-index: 1; padding: 2rem 1.5rem; max-width: 1300px; margin: 0 auto; }

  .st-topbar {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .st-eyebrow {
    font-family: var(--mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    opacity: 0.7;
    margin-bottom: 4px;
  }

  .st-title {
    font-family: var(--display);
    font-size: 38px;
    letter-spacing: 0.06em;
    color: var(--text);
    line-height: 1;
  }

  .st-subtitle {
    font-family: var(--body);
    font-size: 13px;
    color: var(--text-dim);
    margin-top: 4px;
  }

  .st-refresh-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 16px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border-bright);
    border-radius: 4px;
    color: var(--text-dim);
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.08em;
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
  }
  .st-refresh-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }

  /* Stat grid */
  .st-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1px;
    background: var(--border);
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 640px) { .st-stats { grid-template-columns: repeat(2, 1fr); } }

  .st-stat {
    background: var(--surface);
    padding: 1.25rem 1.5rem;
    position: relative;
    overflow: hidden;
    transition: background 0.15s;
  }
  .st-stat::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent);
  }
  .st-stat-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-ghost);
    margin-bottom: 8px;
  }
  .st-stat-value {
    font-family: var(--display);
    font-size: 40px;
    letter-spacing: 0.04em;
    line-height: 1;
    color: var(--text);
  }
  .st-stat-value.urgent { color: var(--red); }
  .st-stat-value.overdue { color: #fb923c; }

  /* Filter bar */
  .st-filters {
    display: flex;
    gap: 10px;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .st-search-wrap {
    position: relative;
    flex: 1;
    min-width: 200px;
    max-width: 320px;
  }
  .st-search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-ghost);
  }
  .st-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px 8px 36px;
    font-family: var(--body);
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s;
  }
  .st-input::placeholder { color: var(--text-ghost); }
  .st-input:focus { border-color: rgba(212,168,67,0.4); }

  .st-select {
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    outline: none;
    cursor: pointer;
    text-transform: uppercase;
    transition: border-color 0.15s;
  }
  .st-select:focus { border-color: rgba(212,168,67,0.35); }
  .st-select option { background: var(--ink); color: var(--text); }

  /* Layout */
  .st-layout {
    display: flex;
    gap: 1.5rem;
    align-items: flex-start;
  }
  .st-main { flex: 1; min-width: 0; }
  .st-sidebar { width: 300px; flex-shrink: 0; }
  @media (max-width: 1024px) {
    .st-layout { flex-direction: column; }
    .st-sidebar { width: 100%; }
  }

  /* Case table */
  .st-table {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
  }
  .st-table-header {
    display: grid;
    grid-template-columns: 1fr auto;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.2);
  }
  .st-table-title {
    font-family: var(--cond);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text);
  }
  .st-count {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-ghost);
    letter-spacing: 0.08em;
  }

  .st-case-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    transition: background 0.12s;
    position: relative;
  }
  .st-case-row::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gold);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .st-case-row:last-child { border-bottom: none; }
  .st-case-row:hover {
    background: rgba(255,255,255,0.03);
  }
  .st-case-row:hover::before { opacity: 1; }

  .st-case-number {
    font-family: var(--mono);
    font-size: 12px;
    font-weight: 600;
    color: var(--gold-bright);
    letter-spacing: 0.06em;
    white-space: nowrap;
    min-width: 120px;
  }

  .st-case-info { flex: 1; min-width: 0; }

  .st-case-name {
    font-family: var(--body);
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 3px;
  }

  .st-case-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .st-meta-item {
    font-family: var(--mono);
    font-size: 10px;
    color: var(--text-ghost);
    letter-spacing: 0.06em;
  }

  .st-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 2px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .st-pill-gray { background: rgba(255,255,255,0.06); color: var(--text-dim); border: 1px solid var(--border); }
  .st-pill-gold { background: var(--gold-dim); color: var(--gold-bright); border: 1px solid rgba(212,168,67,0.25); }
  .st-pill-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(62,207,142,0.2); }
  .st-pill-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(77,166,255,0.2); }
  .st-pill-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(245,101,101,0.2); }
  .st-pill-purple { background: rgba(167,139,250,0.12); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }

  /* Readiness bar */
  .st-readiness {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    min-width: 90px;
  }
  .st-readiness-label {
    font-family: var(--mono);
    font-size: 9px;
    color: var(--text-ghost);
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .st-readiness-bar {
    width: 80px;
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 0;
    overflow: hidden;
  }
  .st-readiness-fill {
    height: 100%;
    border-radius: 0;
    transition: width 0.5s ease;
  }
  .st-readiness-fill.high { background: var(--green); }
  .st-readiness-fill.mid { background: var(--gold); }
  .st-readiness-fill.low { background: var(--red); }
  .st-readiness-score {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
  }
  .st-readiness-score.high { color: var(--green); }
  .st-readiness-score.mid { color: var(--gold-bright); }
  .st-readiness-score.low { color: var(--red); }

  .st-arrow {
    color: var(--text-ghost);
    transition: color 0.15s, transform 0.15s;
    flex-shrink: 0;
  }
  .st-case-row:hover .st-arrow { color: var(--gold-bright); transform: translate(2px, -2px); }

  /* Loading / empty */
  .st-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: var(--text-ghost);
    gap: 12px;
  }
  .st-empty-icon { opacity: 0.15; }
  .st-empty-text {
    font-family: var(--mono);
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  /* Spinner */
  .st-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ─── SIDEBAR ─── */
  .st-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .st-panel::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.18), transparent);
    pointer-events: none;
  }

  .st-panel-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .st-panel-title {
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .st-live-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--green);
    padding: 2px 6px;
    border: 1px solid rgba(62,207,142,0.25);
    border-radius: 2px;
    background: var(--green-dim);
  }
  .st-live-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 6px var(--green);
    animation: livepulse 2s ease infinite;
  }
  @keyframes livepulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .st-alerts-list {
    max-height: 480px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }

  .st-alert-item {
    display: block;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    text-decoration: none;
    transition: background 0.12s;
  }
  .st-alert-item:last-child { border-bottom: none; }
  .st-alert-item:hover { background: rgba(255,255,255,0.03); }

  .st-alert-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
  }
  .st-alert-case {
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--gold-bright);
    text-transform: uppercase;
  }
  .st-alert-time {
    font-family: var(--mono);
    font-size: 9px;
    color: var(--text-ghost);
  }
  .st-alert-body {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .st-alert-text {
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.5;
  }

  .st-panel-footer {
    padding: 10px 16px;
    border-top: 1px solid var(--border);
    background: rgba(0,0,0,0.15);
    font-family: var(--mono);
    font-size: 9px;
    color: var(--text-ghost);
    letter-spacing: 0.1em;
    text-align: center;
    text-transform: uppercase;
  }

  .st-tip-panel {
    margin-top: 12px;
  }
  .st-tip-body {
    padding: 14px 16px;
  }
  .st-tip-title {
    font-family: var(--cond);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--blue);
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
  .st-tip-text {
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.6;
  }
  .st-tip-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 100%;
    margin-top: 12px;
    padding: 8px;
    background: rgba(77,166,255,0.1);
    border: 1px solid rgba(77,166,255,0.25);
    border-radius: 4px;
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--blue);
    cursor: pointer;
    transition: all 0.15s;
  }
  .st-tip-btn:hover { background: rgba(77,166,255,0.18); }
`;

function getStatusPillClass(status: string) {
  if (["ready_for_export", "exported"].includes(status)) return "st-pill st-pill-green";
  if (status === "review") return "st-pill st-pill-blue";
  if (["packet_building", "processing"].includes(status)) return "st-pill st-pill-gold";
  if (status === "intake_pending") return "st-pill st-pill-red";
  return "st-pill st-pill-gray";
}

function getPriorityClass(priority: string) {
  if (priority === "urgent") return "st-pill st-pill-red";
  if (priority === "high") return "st-pill st-pill-gold";
  if (priority === "low") return "st-pill st-pill-gray";
  return "st-pill st-pill-blue";
}

function getReadinessClass(score: number) {
  return score >= 75 ? "high" : score >= 40 ? "mid" : "low";
}

export default function CaseInboxPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [alerts, setAlerts] = useState<Array<{ id: string; type: "message" | "upload" | "task"; text: string; time: string; caseId: string; caseNumber: string }>>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchCases();

    const caseSub = supabase.channel("all_cases_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "cases" }, () => fetchCases())
      .subscribe();

    const msgSub = supabase.channel("global_messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: "sender_type=eq.veteran" }, async (payload) => {
        const newMsg = payload.new;
        const { data: cData } = await supabase.from("cases").select("case_number").eq("id", newMsg.case_id).single();
        setAlerts((prev) => [{
          id: newMsg.id, type: "message" as const,
          text: `${newMsg.sender_name}: "${newMsg.content.substring(0, 50)}${newMsg.content.length > 50 ? "..." : ""}"`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          caseId: newMsg.case_id, caseNumber: cData?.case_number || "?",
        }, ...prev].slice(0, 10));
      }).subscribe();

    const uploadSub = supabase.channel("global_uploads")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "documents" }, async (payload) => {
        const newDoc = payload.new;
        const { data: cData } = await supabase.from("cases").select("case_number").eq("id", newDoc.case_id).single();
        setAlerts((prev) => [{
          id: newDoc.id, type: "upload" as const,
          text: `Document uploaded: ${newDoc.file_name}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          caseId: newDoc.case_id, caseNumber: cData?.case_number || "?",
        }, ...prev].slice(0, 10));
      }).subscribe();

    return () => {
      caseSub.unsubscribe();
      msgSub.unsubscribe();
      uploadSub.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchCases() {
    setLoading(true);
    const { data } = await supabase.from("cases").select("*, veteran:veterans(*), site:sites(*)").order("created_at", { ascending: false });
    setCases((data as Case[]) || []);
    setLoading(false);
  }

  const filtered = cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const vet = c.veteran;
      return (
        c.case_number.toLowerCase().includes(q) ||
        (vet && `${vet.first_name} ${vet.last_name}`.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const stats = {
    total: cases.length,
    urgent: cases.filter((c) => c.priority === "urgent").length,
    overdue: cases.filter((c) => c.sla_due_at && new Date(c.sla_due_at) < new Date()).length,
    pendingIntake: cases.filter((c) => c.status === "intake_pending").length,
  };

  return (
    <div className="st-shell">
      <style>{STYLES}</style>
      <div className="st-content">
        {/* Top bar */}
        <div className="st-topbar">
          <div>
            <div className="st-eyebrow">ClearClaim VSO Platform</div>
            <div className="st-title">Case Inbox</div>
            <div className="st-subtitle">Manage and route cases across all sites</div>
          </div>
          <button className="st-refresh-btn" onClick={fetchCases}>
            <RefreshCw size={13} className={loading ? "st-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="st-stats">
          {[
            { label: "Total Cases", value: stats.total, cls: "" },
            { label: "Urgent", value: stats.urgent, cls: "urgent" },
            { label: "SLA Overdue", value: stats.overdue, cls: "overdue" },
            { label: "Pending Intake", value: stats.pendingIntake, cls: "" },
          ].map((s) => (
            <div key={s.label} className="st-stat">
              <div className="st-stat-label">{s.label}</div>
              <div className={`st-stat-value ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="st-filters">
          <div className="st-search-wrap">
            <Search size={14} className="st-search-icon" />
            <input
              className="st-input"
              placeholder="Search cases or veterans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="st-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="intake_pending">Intake Pending</option>
            <option value="intake_in_progress">Intake In Progress</option>
            <option value="intake_complete">Intake Complete</option>
            <option value="processing">Processing</option>
            <option value="review">Review</option>
            <option value="packet_building">Packet Building</option>
            <option value="ready_for_export">Ready for Export</option>
            <option value="exported">Exported</option>
          </select>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
            <Filter size={12} style={{ color: "var(--text-ghost)" }} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-ghost)", letterSpacing: "0.1em" }}>
              {filtered.length} RESULT{filtered.length !== 1 ? "S" : ""}
            </span>
          </div>
        </div>

        {/* Layout */}
        <div className="st-layout">
          {/* Case list */}
          <div className="st-main">
            <div className="st-table">
              <div className="st-table-header">
                <span className="st-table-title">Active Cases</span>
                <span className="st-count">{filtered.length} / {cases.length}</span>
              </div>

              {loading ? (
                <div className="st-empty">
                  <RefreshCw size={28} className="st-empty-icon st-spin" style={{ opacity: 0.3 }} />
                  <span className="st-empty-text">Loading cases...</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="st-empty">
                  <Shield size={32} className="st-empty-icon" />
                  <span className="st-empty-text">No cases match filters</span>
                </div>
              ) : (
                filtered.map((c) => {
                  const vet = c.veteran;
                  const isOverdue = c.sla_due_at && new Date(c.sla_due_at) < new Date();
                  const rc = getReadinessClass(c.packet_readiness_score);
                  return (
                    <Link key={c.id} href={`/staff/case/${c.id}`} className="st-case-row">
                      <span className="st-case-number">{c.case_number}</span>

                      <div className="st-case-info">
                        <div className="st-case-name">
                          {vet ? `${vet.first_name} ${vet.last_name}` : "Unknown Veteran"}
                        </div>
                        <div className="st-case-meta">
                          <span className={getStatusPillClass(c.status)}>
                            {CASE_STATUS_LABELS[c.status]}
                          </span>
                          <span className={getPriorityClass(c.priority)}>{c.priority}</span>
                          {isOverdue && (
                            <span className="st-pill st-pill-red">
                              <Clock size={8} /> SLA Overdue
                            </span>
                          )}
                          {vet?.branch_of_service && (
                            <span className="st-meta-item">{vet.branch_of_service}</span>
                          )}
                          {c.site?.name && (
                            <span className="st-meta-item">{c.site.name}</span>
                          )}
                          <span className="st-meta-item" style={{ color: "var(--text-ghost)" }}>
                            {c.created_at ? formatDistanceToNow(new Date(c.created_at), { addSuffix: true }) : ""}
                          </span>
                        </div>
                      </div>

                      <div className="st-readiness hidden sm:flex">
                        <span className="st-readiness-label">Readiness</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div className="st-readiness-bar">
                            <div className={`st-readiness-fill ${rc}`} style={{ width: `${c.packet_readiness_score}%` }} />
                          </div>
                          <span className={`st-readiness-score ${rc}`}>{c.packet_readiness_score}%</span>
                        </div>
                      </div>

                      <ArrowUpRight size={16} className="st-arrow" />
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="st-sidebar">
            <div className="st-panel">
              <div className="st-panel-header">
                <span className="st-panel-title">
                  <Zap size={13} color="var(--gold)" />
                  Live Alerts
                </span>
                <span className="st-live-badge">
                  <span className="st-live-dot" />
                  Live
                </span>
              </div>

              <div className="st-alerts-list">
                {alerts.length === 0 ? (
                  <div className="st-empty" style={{ padding: "2.5rem 1rem" }}>
                    <Clock size={24} className="st-empty-icon" />
                    <span className="st-empty-text">Awaiting activity...</span>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Link key={alert.id} href={`/staff/case/${alert.caseId}`} className="st-alert-item">
                      <div className="st-alert-top">
                        <span className="st-alert-case">CASE {alert.caseNumber}</span>
                        <span className="st-alert-time">{alert.time}</span>
                      </div>
                      <div className="st-alert-body">
                        <div style={{ marginTop: "2px", flexShrink: 0 }}>
                          {alert.type === "message" ? (
                            <MessageSquare size={11} color="var(--purple)" />
                          ) : (
                            <Upload size={11} color="var(--green)" />
                          )}
                        </div>
                        <span className="st-alert-text">{alert.text}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="st-panel-footer">Monitoring all active cases</div>
            </div>

            <div className="st-panel st-tip-panel">
              <div className="st-panel-header">
                <span className="st-panel-title">
                  <Sparkles size={13} color="var(--blue)" />
                  AI Workload Intelligence
                </span>
              </div>
              <div className="st-tip-body">
                <p className="st-tip-text">
                  {stats.total > 0
                    ? `${cases.filter(c => c.packet_readiness_score >= 80).length} case${cases.filter(c => c.packet_readiness_score >= 80).length !== 1 ? "s are" : " is"} 80%+ ready. Prioritize these for final review and export.`
                    : "Run the demo seeder to populate cases for analysis."}
                </p>
                <button className="st-tip-btn">
                  <Sparkles size={12} />
                  Review Ready Cases
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
