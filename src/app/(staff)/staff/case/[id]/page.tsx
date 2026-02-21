"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Case, Condition, CASE_STATUS_LABELS } from "@/lib/types";
import {
  ArrowLeft, FileText, Heart, AlertTriangle, CheckCircle2, Clock,
  Package, BookOpen, Search, Send, ExternalLink, MessageSquare, Upload,
  Eye, ChevronRight, XCircle, Loader2, Plus, Sparkles, Brain,
  FileSignature, TrendingUp, Lightbulb, Copy, Zap, Shield,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";

type TabKey = "overview" | "documents" | "tasks" | "messages" | "ai-tools" | "doc-intel";

interface Message {
  id: string;
  content: string;
  sender_type: string;
  sender_name: string;
  created_at: string;
  read_at: string | null;
}

const STATUS_PIPELINE = [
  "intake_pending", "intake_in_progress", "intake_complete",
  "processing", "review", "packet_building", "ready_for_export", "exported",
] as const;

const STATUS_LABELS_SHORT: Record<string, string> = {
  intake_pending: "Intake",
  intake_in_progress: "In Progress",
  intake_complete: "Complete",
  processing: "Processing",
  review: "Review",
  packet_building: "Building",
  ready_for_export: "Ready",
  exported: "Exported",
};

const TASK_TEMPLATES = [
  { title: "Upload DD-214", description: "Please upload your DD-214 or equivalent separation document.", task_type: "upload" },
  { title: "Upload Service Treatment Records", description: "Upload your military medical/service treatment records.", task_type: "upload" },
  { title: "Write Personal Statement", description: "Draft a personal statement describing how your conditions relate to service.", task_type: "provide_statement" },
  { title: "Upload Nexus Letter", description: "Upload a medical opinion linking your condition to military service.", task_type: "upload" },
  { title: "Complete Intake Questionnaire", description: "Answer questions about your service history and current conditions.", task_type: "answer_questions" },
  { title: "Clarify Treatment Timeline", description: "Provide details about gaps in your treatment history.", task_type: "clarify_timeline" },
];

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
    --amber: #fb923c;
    --text: #cdd5e0;
    --text-dim: rgba(205,213,224,0.45);
    --text-ghost: rgba(205,213,224,0.22);
    --mono: 'IBM Plex Mono', monospace;
    --body: 'Barlow', sans-serif;
    --cond: 'Barlow Condensed', sans-serif;
    --display: 'Bebas Neue', sans-serif;
  }

  .sc-shell {
    min-height: 100vh;
    background: var(--obsidian);
    font-family: var(--body);
    color: var(--text);
    position: relative;
  }
  .sc-shell::before {
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
  .sc-shell::after {
    content: '';
    position: fixed;
    inset: 0;
    background: radial-gradient(ellipse 70% 40% at 50% 0%, rgba(212,168,67,0.04) 0%, transparent 60%);
    pointer-events: none;
    z-index: 0;
  }

  .sc-content { position: relative; z-index: 1; padding: 1.5rem; max-width: 1300px; margin: 0 auto; }

  /* Back link */
  .sc-back {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: var(--mono);
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-ghost);
    text-decoration: none;
    margin-bottom: 1.25rem;
    transition: color 0.15s;
  }
  .sc-back:hover { color: var(--gold-bright); }

  /* Page header */
  .sc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .sc-case-id {
    font-family: var(--display);
    font-size: 42px;
    letter-spacing: 0.06em;
    color: var(--text);
    line-height: 1;
  }

  .sc-header-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 8px;
  }

  .sc-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Pipeline */
  .sc-pipeline {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 14px 16px;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    position: relative;
  }
  .sc-pipeline::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent);
  }

  .sc-pipeline-inner {
    display: flex;
    align-items: center;
    gap: 4px;
    min-width: max-content;
  }

  .sc-pipe-step {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    border-radius: 3px;
    font-family: var(--cond);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
  }
  .sc-pipe-step.done { background: var(--green-dim); color: var(--green); border-color: rgba(62,207,142,0.2); }
  .sc-pipe-step.active { background: var(--gold-dim); color: var(--gold-bright); border-color: rgba(212,168,67,0.35); }
  .sc-pipe-step.future { background: rgba(255,255,255,0.03); color: var(--text-ghost); border-color: var(--border); }
  .sc-pipe-step:hover { border-color: rgba(212,168,67,0.3) !important; color: var(--gold-bright) !important; }

  .sc-pipe-divider {
    width: 20px;
    height: 1px;
    flex-shrink: 0;
  }
  .sc-pipe-divider.done { background: var(--green); }
  .sc-pipe-divider.future { background: var(--border); }

  /* Tabs */
  .sc-tabs {
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
    display: flex;
    gap: 0;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .sc-tabs::-webkit-scrollbar { display: none; }

  .sc-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 12px 18px;
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-ghost);
    border-bottom: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
    position: relative;
  }
  .sc-tab:hover { color: var(--text-dim); }
  .sc-tab.active {
    color: var(--gold-bright);
    border-bottom-color: var(--gold);
  }
  .sc-tab.active::after {
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

  .sc-tab-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 3px;
    border-radius: 2px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 600;
    background: var(--gold);
    color: var(--obsidian);
  }
  .sc-tab-badge.msgs { background: var(--red); }

  /* Pill / Badge */
  .sc-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    border-radius: 2px;
    font-family: var(--mono);
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .sc-pill-gray { background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid var(--border); }
  .sc-pill-gold { background: var(--gold-dim); color: var(--gold-bright); border: 1px solid rgba(212,168,67,0.25); }
  .sc-pill-green { background: var(--green-dim); color: var(--green); border: 1px solid rgba(62,207,142,0.2); }
  .sc-pill-blue { background: var(--blue-dim); color: var(--blue); border: 1px solid rgba(77,166,255,0.2); }
  .sc-pill-red { background: var(--red-dim); color: var(--red); border: 1px solid rgba(245,101,101,0.2); }
  .sc-pill-purple { background: rgba(167,139,250,0.12); color: var(--purple); border: 1px solid rgba(167,139,250,0.2); }
  .sc-pill-amber { background: rgba(251,146,60,0.1); color: var(--amber); border: 1px solid rgba(251,146,60,0.2); }

  /* Cards */
  .sc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .sc-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent);
    pointer-events: none;
  }

  .sc-card-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.18);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .sc-card-title {
    font-family: var(--cond);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text);
  }
  .sc-card-body { padding: 16px; }

  /* Two-column layout */
  .sc-two-col {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 1.5rem;
    align-items: start;
  }
  @media (max-width: 1024px) {
    .sc-two-col { grid-template-columns: 1fr; }
  }

  .sc-col-stack { display: flex; flex-direction: column; gap: 1.25rem; }

  /* AI strategy banner */
  .sc-ai-banner {
    background: var(--surface);
    border: 1px solid var(--border);
    border-left: 3px solid var(--blue);
    border-radius: 6px;
    padding: 16px;
    position: relative;
    overflow: hidden;
  }
  .sc-ai-banner::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 60% at 0% 50%, rgba(77,166,255,0.04) 0%, transparent 70%);
    pointer-events: none;
  }

  .sc-ai-banner-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .sc-ai-banner-title {
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue);
    display: flex;
    align-items: center;
    gap: 7px;
  }
  .sc-ai-summary {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 12px;
  }
  .sc-ai-steps { display: flex; flex-direction: column; gap: 6px; }
  .sc-ai-step {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-dim);
    padding: 6px 10px;
    background: rgba(77,166,255,0.05);
    border: 1px solid rgba(77,166,255,0.12);
    border-radius: 4px;
  }

  /* Vet info grid */
  .sc-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  @media (max-width: 600px) { .sc-info-grid { grid-template-columns: 1fr; } }

  .sc-info-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-ghost);
    margin-bottom: 3px;
  }
  .sc-info-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
  }

  /* Conditions */
  .sc-condition {
    padding: 14px 16px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: rgba(255,255,255,0.02);
    transition: all 0.15s;
    position: relative;
    overflow: hidden;
  }
  .sc-condition::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: var(--gold);
    opacity: 0;
    transition: opacity 0.15s;
  }
  .sc-condition:hover { border-color: var(--border-bright); background: rgba(255,255,255,0.035); }
  .sc-condition:hover::before { opacity: 1; }

  .sc-cond-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .sc-cond-name {
    font-family: var(--body);
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }
  .sc-cond-actions { display: flex; align-items: center; gap: 8px; }
  .sc-cond-ai {
    margin-top: 10px;
    padding: 10px 12px;
    background: rgba(77,166,255,0.06);
    border: 1px solid rgba(77,166,255,0.12);
    border-radius: 4px;
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.6;
  }
  .sc-cond-ai-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 5px;
  }
  .sc-symptoms { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
  .sc-symptom {
    font-family: var(--mono);
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 2px;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  /* Score ring sidebar */
  .sc-score-wrap { display: flex; flex-direction: column; align-items: center; padding: 20px; }
  .sc-score-ring { position: relative; width: 100px; height: 100px; }
  .sc-score-ring svg { transform: rotate(-90deg); }
  .sc-score-inner {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .sc-score-num {
    font-family: var(--display);
    font-size: 30px;
    letter-spacing: 0.04em;
    line-height: 1;
  }
  .sc-score-lbl {
    font-family: var(--mono);
    font-size: 8px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-ghost);
    margin-top: 2px;
  }
  .sc-metrics { width: 100%; margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
  .sc-metric-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .sc-metric-label { font-family: var(--mono); font-size: 10px; color: var(--text-ghost); letter-spacing: 0.08em; }
  .sc-metric-bar { flex: 1; height: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }
  .sc-metric-fill { height: 100%; transition: width 0.5s; }
  .sc-metric-fill.high { background: var(--green); }
  .sc-metric-fill.mid { background: var(--gold); }
  .sc-metric-fill.low { background: var(--red); }
  .sc-metric-val { font-family: var(--mono); font-size: 11px; font-weight: 600; min-width: 30px; text-align: right; }

  /* Buttons */
  .sc-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 16px;
    border-radius: 4px;
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    border: none;
    transition: all 0.15s;
  }
  .sc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .sc-btn-gold {
    background: linear-gradient(135deg, var(--gold), var(--gold-bright));
    color: var(--obsidian);
    box-shadow: 0 2px 10px rgba(212,168,67,0.2);
  }
  .sc-btn-gold:hover:not(:disabled) { filter: brightness(1.08); box-shadow: 0 4px 18px rgba(212,168,67,0.35); transform: translateY(-1px); }

  .sc-btn-ghost {
    background: rgba(255,255,255,0.05);
    color: var(--text-dim);
    border: 1px solid var(--border-bright);
  }
  .sc-btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.09); color: var(--text); }

  .sc-btn-green {
    background: var(--green-dim);
    color: var(--green);
    border: 1px solid rgba(62,207,142,0.25);
  }
  .sc-btn-green:hover:not(:disabled) { background: rgba(62,207,142,0.2); }

  .sc-btn-red {
    background: var(--red-dim);
    color: var(--red);
    border: 1px solid rgba(245,101,101,0.2);
  }
  .sc-btn-red:hover:not(:disabled) { background: rgba(245,101,101,0.15); }

  .sc-btn-blue {
    background: var(--blue-dim);
    color: var(--blue);
    border: 1px solid rgba(77,166,255,0.22);
  }
  .sc-btn-blue:hover:not(:disabled) { background: rgba(77,166,255,0.18); }

  .sc-btn-purple {
    background: rgba(167,139,250,0.1);
    color: var(--purple);
    border: 1px solid rgba(167,139,250,0.2);
  }
  .sc-btn-purple:hover:not(:disabled) { background: rgba(167,139,250,0.16); }

  .sc-btn-amber {
    background: rgba(251,146,60,0.1);
    color: var(--amber);
    border: 1px solid rgba(251,146,60,0.2);
  }
  .sc-btn-amber:hover:not(:disabled) { background: rgba(251,146,60,0.16); }

  .sc-btn-sm { padding: 5px 11px; font-size: 11px; border-radius: 3px; }

  /* Quick actions */
  .sc-quick-action {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: rgba(255,255,255,0.02);
    text-decoration: none;
    color: var(--text-dim);
    font-family: var(--body);
    font-size: 13px;
    transition: all 0.15s;
  }
  .sc-quick-action:hover { border-color: var(--border-bright); background: rgba(255,255,255,0.04); color: var(--text); }
  .sc-quick-action svg:last-child { margin-left: auto; opacity: 0; transition: opacity 0.15s; }
  .sc-quick-action:hover svg:last-child { opacity: 1; }

  /* SLA */
  .sc-sla {
    padding: 14px 16px;
    border-radius: 4px;
    border: 1px solid;
  }
  .sc-sla.ok { border-color: var(--border); background: rgba(255,255,255,0.02); }
  .sc-sla.overdue { border-color: rgba(245,101,101,0.25); background: var(--red-dim); }
  .sc-sla-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--text-ghost); margin-bottom: 6px; }
  .sc-sla-date { font-family: var(--display); font-size: 24px; letter-spacing: 0.04em; line-height: 1; }
  .sc-sla-date.ok { color: var(--text); }
  .sc-sla-date.overdue { color: var(--red); }

  /* Documents */
  .sc-doc-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.12s;
  }
  .sc-doc-item:last-child { border-bottom: none; }
  .sc-doc-item:hover { background: rgba(255,255,255,0.02); }

  .sc-doc-icon {
    width: 36px;
    height: 36px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .sc-doc-name { font-family: var(--body); font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 3px; }
  .sc-doc-meta { font-family: var(--mono); font-size: 10px; color: var(--text-ghost); letter-spacing: 0.06em; }

  /* Tasks */
  .sc-task-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.12s;
  }
  .sc-task-item:last-child { border-bottom: none; }
  .sc-task-icon {
    width: 32px; height: 32px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sc-task-name { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
  .sc-task-name.done { text-decoration: line-through; color: var(--text-ghost); }
  .sc-task-desc { font-size: 12px; color: var(--text-dim); }
  .sc-task-picker {
    padding: 16px;
    background: rgba(77,166,255,0.04);
    border: 1px solid rgba(77,166,255,0.15);
    border-radius: 6px;
    margin-bottom: 14px;
  }
  .sc-task-picker-title {
    font-family: var(--cond);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--blue);
    margin-bottom: 10px;
  }
  .sc-task-picker-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  @media (max-width: 600px) { .sc-task-picker-grid { grid-template-columns: 1fr; } }

  .sc-task-pick-btn {
    text-align: left;
    padding: 10px 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .sc-task-pick-btn:hover { border-color: rgba(77,166,255,0.3); background: rgba(77,166,255,0.06); }
  .sc-task-pick-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 3px; display: flex; align-items: center; gap: 7px; }
  .sc-task-pick-desc { font-size: 11px; color: var(--text-ghost); }

  /* Messages */
  .sc-messages-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 340px);
    min-height: 420px;
  }
  .sc-msg-header {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.18);
    flex-shrink: 0;
  }
  .sc-msg-list {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .sc-msg-bubble {
    max-width: 70%;
    padding: 11px 15px;
    font-size: 13px;
    line-height: 1.6;
    font-family: var(--body);
  }
  .sc-msg-bubble.staff {
    background: linear-gradient(135deg, var(--gold), var(--gold-bright));
    color: var(--obsidian);
    margin-left: auto;
    border-radius: 8px 8px 2px 8px;
    font-weight: 500;
  }
  .sc-msg-bubble.veteran {
    background: var(--surface-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-left: 2px solid var(--blue);
    border-radius: 2px 8px 8px 8px;
  }
  .sc-msg-meta { font-family: var(--mono); font-size: 9px; opacity: 0.55; letter-spacing: 0.06em; margin-bottom: 4px; }

  .sc-smart-replies {
    padding: 10px 16px;
    border-top: 1px dashed rgba(77,166,255,0.2);
    background: rgba(77,166,255,0.03);
    flex-shrink: 0;
  }
  .sc-smart-label { font-family: var(--mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--blue); margin-bottom: 7px; display: flex; align-items: center; gap: 5px; }
  .sc-smart-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .sc-smart-chip {
    padding: 4px 10px;
    border-radius: 3px;
    font-family: var(--cond);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(77,166,255,0.2);
    color: var(--blue);
    cursor: pointer;
    transition: all 0.12s;
  }
  .sc-smart-chip:hover { background: rgba(77,166,255,0.1); }

  .sc-msg-form {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    display: flex;
    gap: 8px;
    align-items: flex-end;
    background: rgba(0,0,0,0.15);
    flex-shrink: 0;
  }

  .sc-textarea {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 9px 12px;
    font-family: var(--body);
    font-size: 13px;
    color: var(--text);
    outline: none;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    transition: border-color 0.15s;
  }
  .sc-textarea::placeholder { color: var(--text-ghost); }
  .sc-textarea:focus { border-color: rgba(212,168,67,0.35); }

  /* AI Tools */
  .sc-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 768px) { .sc-ai-grid { grid-template-columns: 1fr; } }

  .sc-ai-tool {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    position: relative;
  }
  .sc-ai-tool::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent);
    pointer-events: none;
  }

  .sc-ai-tool-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    background: rgba(0,0,0,0.18);
  }
  .sc-ai-tool-icon {
    width: 36px; height: 36px;
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sc-ai-tool-name { font-family: var(--cond); font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text); }
  .sc-ai-tool-desc { font-size: 11px; color: var(--text-dim); margin-top: 1px; }

  .sc-ai-tool-body { padding: 14px 16px; }

  .sc-ai-result {
    margin-top: 12px;
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px;
    max-height: 280px;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.07) transparent;
  }
  .sc-ai-result pre { font-family: var(--body); font-size: 13px; color: var(--text); white-space: pre-wrap; line-height: 1.65; }
  .sc-ai-result-label {
    font-family: var(--mono);
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .sc-rating-hero { text-align: center; padding: 16px 0; }
  .sc-rating-num {
    font-family: var(--display);
    font-size: 64px;
    letter-spacing: 0.04em;
    background: linear-gradient(135deg, var(--gold), var(--gold-bright), #fff8d6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
    filter: drop-shadow(0 0 20px rgba(212,168,67,0.3));
  }
  .sc-rating-conf { font-family: var(--mono); font-size: 10px; color: var(--text-ghost); letter-spacing: 0.14em; text-transform: uppercase; margin-top: 4px; }

  .sc-rating-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: rgba(255,255,255,0.02);
    border: 1px solid var(--border);
    border-radius: 4px;
    margin-bottom: 6px;
  }
  .sc-rating-cond { font-size: 12px; font-weight: 500; color: var(--text); }
  .sc-rating-rationale { font-size: 11px; color: var(--text-dim); margin-top: 3px; }

  .sc-nexus-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 4px;
    background: rgba(255,255,255,0.02);
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: 6px;
  }
  .sc-nexus-btn:hover { border-color: rgba(77,166,255,0.3); background: rgba(77,166,255,0.05); }
  .sc-nexus-btn-name { font-size: 13px; font-weight: 500; color: var(--text); }
  .sc-nexus-btn-hint { font-family: var(--mono); font-size: 10px; color: var(--text-ghost); margin-top: 2px; }

  .sc-secondary-item {
    padding: 12px;
    background: rgba(251,146,60,0.04);
    border: 1px solid rgba(251,146,60,0.15);
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .sc-secondary-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; flex-wrap: wrap; gap: 6px; }
  .sc-secondary-name { font-size: 13px; font-weight: 600; color: var(--text); }

  /* Divider */
  .sc-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* Loading */
  .sc-loading {
    display: flex; align-items: center; justify-content: center;
    min-height: 60vh; flex-direction: column; gap: 14px;
    font-family: var(--mono); font-size: 12px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--text-ghost);
  }
  .sc-spin { animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .sc-copy-btn {
    background: none; border: none; cursor: pointer;
    display: flex; align-items: center; gap: 4px;
    font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--text-ghost);
    transition: color 0.12s; padding: 0;
  }
  .sc-copy-btn:hover { color: var(--text-dim); }

  .sc-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: var(--body); font-size: 13px;
    color: var(--text); outline: none;
    transition: border-color 0.15s;
  }
  .sc-input::placeholder { color: var(--text-ghost); }
  .sc-input:focus { border-color: rgba(212,168,67,0.35); }

  .sc-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 3rem 1rem; gap: 10px;
    color: var(--text-ghost);
  }
  .sc-empty-icon { opacity: 0.12; }
  .sc-empty-text { font-family: var(--mono); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }
`;

function getCondStatusPill(status: string) {
  if (status === "approved") return "sc-pill sc-pill-green";
  if (status === "rejected") return "sc-pill sc-pill-red";
  if (status === "draft") return "sc-pill sc-pill-gold";
  return "sc-pill sc-pill-gray";
}

function getReadinessColor(score: number) {
  if (score >= 75) return "var(--green)";
  if (score >= 40) return "var(--gold)";
  return "var(--red)";
}

function getMetricClass(v: number) {
  return v >= 75 ? "high" : v >= 40 ? "mid" : "low";
}

export default function CaseDashboardPage() {
  const params = useParams();
  const caseId = params.id as string;
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [conditions, setConditions] = useState<Condition[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tasks, setTasks] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [advancingStatus, setAdvancingStatus] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [sendingTask, setSendingTask] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [staffProfile, setStaffProfile] = useState<any>(null);

  const [narrativeLoading, setNarrativeLoading] = useState(false);
  const [narrative, setNarrative] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ratingData, setRatingData] = useState<any>(null);
  const [nexusLoading, setNexusLoading] = useState<string | null>(null);
  const [nexusLetter, setNexusLetter] = useState<{ conditionName: string; letter: string } | null>(null);
  const [secondaryLoading, setSecondaryLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [secondarySuggestions, setSecondarySuggestions] = useState<any[]>([]);
  const [smartReplies, setSmartReplies] = useState<Array<{ label: string; message: string }>>([]);
  const [smartReplyLoading, setSmartReplyLoading] = useState(false);
  const [strategy, setStrategy] = useState<{ plan: string[]; summary: string } | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [docIntel, setDocIntel] = useState<any>(null);
  const [docIntelLoading, setDocIntelLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (!caseId) return;
    const messageSub = supabase.channel(`staff_messages_${caseId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "case_messages", filter: `case_id=eq.${caseId}` }, (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => { if (prev.some((m) => m.id === newMsg.id)) return prev; return [...prev, newMsg]; });
        if (newMsg.sender_type === "veteran") toast.info(`Message from ${newMsg.sender_name}`);
      }).subscribe();

    const docSub = supabase.channel(`staff_docs_${caseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "documents", filter: `case_id=eq.${caseId}` }, () => {
        supabase.from("documents").select("*").eq("case_id", caseId).order("created_at", { ascending: false }).then(({ data }) => { if (data) setDocuments(data); });
        toast.info("Document updated");
      }).subscribe();

    const taskSub = supabase.channel(`staff_tasks_${caseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "veteran_tasks", filter: `case_id=eq.${caseId}` }, () => {
        supabase.from("veteran_tasks").select("*").eq("case_id", caseId).order("created_at").then(({ data }) => { if (data) setTasks(data); });
      }).subscribe();

    const condSub = supabase.channel(`staff_conds_${caseId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "conditions", filter: `case_id=eq.${caseId}` }, () => {
        supabase.from("conditions").select("*").eq("case_id", caseId).order("created_at").then(({ data }) => { if (data) setConditions(data as Condition[]); });
      }).subscribe();

    const caseSub = supabase.channel(`staff_case_${caseId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "cases", filter: `id=eq.${caseId}` }, (payload) => {
        setCaseData((prev) => prev ? { ...prev, ...(payload.new as Case) } : payload.new as Case);
      }).subscribe();

    return () => { messageSub.unsubscribe(); docSub.unsubscribe(); taskSub.unsubscribe(); condSub.unsubscribe(); caseSub.unsubscribe(); };
  }, [caseId, supabase]);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
      setStaffProfile(profile);
    }
    const [caseRes, condRes, msgRes] = await Promise.all([
      supabase.from("cases").select("*, veteran:veterans(*), site:sites(*)").eq("id", caseId).single(),
      supabase.from("conditions").select("*").eq("case_id", caseId).order("created_at"),
      supabase.from("case_messages").select("*").eq("case_id", caseId).order("created_at"),
    ]);
    const cData = caseRes.data as Case | null;
    setCaseData(cData);
    setConditions((condRes.data as Condition[]) || []);
    setMessages((msgRes.data as Message[]) || []);
    if (cData?.veteran) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vetId = (cData.veteran as any).id;
      const [docRes, taskRes] = await Promise.all([
        supabase.from("documents").select("*").eq("case_id", caseId).order("created_at", { ascending: false }),
        supabase.from("veteran_tasks").select("*").eq("veteran_id", vetId).order("created_at"),
      ]);
      setDocuments(docRes.data || []);
      setTasks(taskRes.data || []);
    }
    setLoading(false);
  }, [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const generateStrategy = useCallback(async () => {
    if (!caseId || strategyLoading) return;
    setStrategyLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-gaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }) });
      const data = await res.json();
      if (data.analysis) {
        setStrategy({
          summary: data.analysis.summary || "Case progressing. Critical evidence gaps identified.",
          plan: data.analysis.next_steps?.slice(0, 3) || ["Request Nexus Letter", "Schedule C&P Exam Prep", "Review treatment records"],
        });
      }
    } catch { /* silent */ }
    setStrategyLoading(false);
  }, [caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData(); generateStrategy(); }, [loadData, generateStrategy]);

  async function handleAdvanceStatus() {
    if (!caseData || advancingStatus) return;
    const idx = STATUS_PIPELINE.indexOf(caseData.status as typeof STATUS_PIPELINE[number]);
    if (idx < 0 || idx >= STATUS_PIPELINE.length - 1) return;
    const next = STATUS_PIPELINE[idx + 1];
    setAdvancingStatus(true);
    const { error } = await supabase.from("cases").update({ status: next }).eq("id", caseId);
    if (error) toast.error("Failed to advance status");
    else { setCaseData((prev) => prev ? { ...prev, status: next } : prev); toast.success(`→ ${CASE_STATUS_LABELS[next]}`); }
    setAdvancingStatus(false);
  }

  async function handleRegressStatus() {
    if (!caseData || advancingStatus) return;
    const idx = STATUS_PIPELINE.indexOf(caseData.status as typeof STATUS_PIPELINE[number]);
    if (idx <= 0) return;
    const prev = STATUS_PIPELINE[idx - 1];
    setAdvancingStatus(true);
    const { error } = await supabase.from("cases").update({ status: prev }).eq("id", caseId);
    if (error) toast.error("Failed");
    else { setCaseData((p) => p ? { ...p, status: prev } : p); toast.success(`↩ ${CASE_STATUS_LABELS[prev]}`); }
    setAdvancingStatus(false);
  }

  async function handleApproveCondition(condId: string) {
    const { error } = await supabase.from("conditions").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", condId);
    if (error) toast.error("Failed");
    else { setConditions((prev) => prev.map((c) => c.id === condId ? { ...c, status: "approved" } : c)); toast.success("Condition approved"); }
  }

  async function handleRejectCondition(condId: string) {
    const { error } = await supabase.from("conditions").update({ status: "rejected" }).eq("id", condId);
    if (error) toast.error("Failed");
    else { setConditions((prev) => prev.map((c) => c.id === condId ? { ...c, status: "rejected" } : c)); toast.success("Condition rejected"); }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sendingMessage || !caseData) return;
    setSendingMessage(true);
    const { data, error } = await supabase.from("case_messages").insert({
      case_id: caseId, sender_id: staffProfile?.id || "unknown", sender_type: "staff",
      sender_name: staffProfile?.full_name || "Caseworker", content: newMessage.trim(),
    }).select().single();
    if (error) toast.error("Failed to send");
    else { setMessages((prev) => [...prev, data as Message]); setNewMessage(""); toast.success("Message sent"); setSmartReplies([]); }
    setSendingMessage(false);
  }

  async function handleSendTask(template: typeof TASK_TEMPLATES[number]) {
    if (!caseData?.veteran || sendingTask) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vetId = (caseData.veteran as any).id;
    setSendingTask(template.title);
    const { error } = await supabase.from("veteran_tasks").insert({
      case_id: caseId, veteran_id: vetId, task_type: template.task_type,
      title: template.title, description: template.description, status: "sent",
      created_by: staffProfile?.id, due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (error) toast.error("Failed to send task");
    else {
      toast.success(`Task sent: ${template.title}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase.from("veteran_tasks").select("*").eq("veteran_id", vetId as any).order("created_at");
      setTasks(data || []);
    }
    setSendingTask(null);
  }

  async function handleGenerateNarrative() {
    setNarrativeLoading(true);
    try {
      const res = await fetch("/api/ai/case-narrative", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }) });
      const data = await res.json();
      if (data.narrative) { setNarrative(data.narrative); toast.success("Narrative generated"); }
    } catch { toast.error("Failed"); }
    setNarrativeLoading(false);
  }

  async function handleEstimateRating() {
    setRatingLoading(true);
    try {
      const res = await fetch("/api/ai/rating-estimator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }) });
      const data = await res.json();
      if (data.estimated_combined_rating !== undefined) { setRatingData(data); toast.success("Rating estimated"); }
    } catch { toast.error("Failed"); }
    setRatingLoading(false);
  }

  async function handleGenerateNexus(conditionId: string) {
    setNexusLoading(conditionId);
    try {
      const res = await fetch("/api/ai/nexus-letter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId, conditionId }) });
      const data = await res.json();
      if (data.letter) { setNexusLetter({ conditionName: data.conditionName, letter: data.letter }); toast.success("Nexus letter generated"); }
    } catch { toast.error("Failed"); }
    setNexusLoading(null);
  }

  async function handleSuggestSecondary() {
    setSecondaryLoading(true);
    try {
      const res = await fetch("/api/ai/secondary-conditions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId }) });
      const data = await res.json();
      if (data.suggestions) { setSecondarySuggestions(data.suggestions); toast.success(`${data.suggestions.length} suggestions found`); }
    } catch { toast.error("Failed"); }
    setSecondaryLoading(false);
  }

  async function handleSmartReply() {
    setSmartReplyLoading(true);
    try {
      const res = await fetch("/api/ai/smart-reply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caseId, recentMessages: messages.slice(-5) }) });
      const data = await res.json();
      if (data.suggestions) setSmartReplies(data.suggestions);
    } catch { toast.error("Failed"); }
    setSmartReplyLoading(false);
  }

  async function handleAddSecondaryCondition(suggestion: { condition_name: string; vasrd_code?: string; rationale?: string }) {
    const { error } = await supabase.from("conditions").insert({
      case_id: caseId, name: suggestion.condition_name,
      icd_code: suggestion.vasrd_code || null, status: "draft", confidence: 0.6,
      ai_summary: suggestion.rationale || null, symptoms: [], treatments: [], conflict_flags: [],
    });
    if (error) toast.error("Failed");
    else {
      toast.success(`Added: ${suggestion.condition_name}`);
      const { data } = await supabase.from("conditions").select("*").eq("case_id", caseId).order("created_at");
      setConditions((data as Condition[]) || []);
    }
  }

  if (loading) {
    return (
      <div className="sc-shell">
        <style>{STYLES}</style>
        <div className="sc-loading">
          <Shield size={36} className="sc-spin" style={{ opacity: 0.2 }} />
          Loading case...
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="sc-shell">
        <style>{STYLES}</style>
        <div className="sc-content">
          <div className="sc-empty" style={{ paddingTop: "5rem" }}>
            <Shield size={40} className="sc-empty-icon" />
            <span className="sc-empty-text">Case not found</span>
            <Link href="/staff" style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--gold-bright)", letterSpacing: "0.1em", textDecoration: "none" }}>← Back to Inbox</Link>
          </div>
        </div>
      </div>
    );
  }

  const vet = caseData.veteran;
  const isOverdue = caseData.sla_due_at && new Date(caseData.sla_due_at) < new Date();
  const currentIdx = STATUS_PIPELINE.indexOf(caseData.status as typeof STATUS_PIPELINE[number]);
  const canAdvance = currentIdx >= 0 && currentIdx < STATUS_PIPELINE.length - 1;
  const canRegress = currentIdx > 0;
  const unreadMessages = messages.filter((m) => m.sender_type === "veteran" && !m.read_at).length;

  return (
    <div className="sc-shell">
      <style>{STYLES}</style>
      <div className="sc-content">
        {/* Back */}
        <Link href="/staff" className="sc-back">
          <ArrowLeft size={12} /> Back to Inbox
        </Link>

        {/* Header */}
        <div className="sc-header">
          <div>
            <div className="sc-case-id">{caseData.case_number}</div>
            <div className="sc-header-meta">
              <span className={`sc-pill ${caseData.status === "review" ? "sc-pill-blue" : caseData.status === "ready_for_export" || caseData.status === "exported" ? "sc-pill-green" : caseData.status === "intake_pending" ? "sc-pill-red" : "sc-pill-gold"}`}>
                {CASE_STATUS_LABELS[caseData.status]}
              </span>
              <span className={`sc-pill ${caseData.priority === "urgent" ? "sc-pill-red" : caseData.priority === "high" ? "sc-pill-gold" : "sc-pill-gray"}`}>
                {caseData.priority}
              </span>
              {isOverdue && <span className="sc-pill sc-pill-red"><Clock size={8} /> SLA Overdue</span>}
               {vet && <span className="sc-pill sc-pill-gray">{vet.first_name} {vet.last_name}</span>}
            </div>
          </div>
          <div className="sc-header-actions">
            {canRegress && (
              <button className="sc-btn sc-btn-ghost" onClick={handleRegressStatus} disabled={advancingStatus}>
                <ArrowLeft size={13} /> Back
              </button>
            )}
            {canAdvance && (
              <button className="sc-btn sc-btn-gold" onClick={handleAdvanceStatus} disabled={advancingStatus}>
                {advancingStatus ? <Loader2 size={13} className="sc-spin" /> : <ChevronRight size={13} />}
                Advance to {STATUS_LABELS_SHORT[STATUS_PIPELINE[currentIdx + 1]] || "Next"}
              </button>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div className="sc-pipeline">
          <div className="sc-pipeline-inner">
            {STATUS_PIPELINE.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <button
                  className={`sc-pipe-step ${i < currentIdx ? "done" : i === currentIdx ? "active" : "future"}`}
                  onClick={async () => {
                    if (i === currentIdx) return;
                    setAdvancingStatus(true);
                    const { error } = await supabase.from("cases").update({ status: s }).eq("id", caseId);
                    if (!error) { setCaseData((prev) => prev ? { ...prev, status: s } : prev); toast.success(`Set: ${CASE_STATUS_LABELS[s]}`); }
                    setAdvancingStatus(false);
                  }}
                >
                  {i < currentIdx && <CheckCircle2 size={11} />}
                  {STATUS_LABELS_SHORT[s] || s}
                </button>
                {i < STATUS_PIPELINE.length - 1 && (
                  <div className={`sc-pipe-divider ${i < currentIdx ? "done" : "future"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="sc-tabs">
          {[
            { key: "overview" as const, label: "Overview" },
            { key: "documents" as const, label: "Documents", count: documents.length },
            { key: "tasks" as const, label: "Tasks", count: tasks.length },
            { key: "messages" as const, label: "Messages", count: unreadMessages, isMsg: true },
            { key: "ai-tools" as const, label: "AI Tools", icon: <Sparkles size={12} /> },
            { key: "doc-intel" as const, label: "Doc Intel", icon: <Zap size={12} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`sc-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {"icon" in tab && tab.icon}
              {tab.label}
              {"count" in tab && typeof tab.count === "number" && tab.count > 0 && (
                <span className={`sc-tab-badge${"isMsg" in tab && tab.isMsg ? " msgs" : ""}`}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="sc-two-col">
            <div className="sc-col-stack">
              {/* AI Strategy */}
              <div className="sc-ai-banner">
                <div className="sc-ai-banner-header">
                  <span className="sc-ai-banner-title">
                    <Brain size={14} /> AI Case Strategy
                  </span>
                  {strategyLoading && <Loader2 size={13} className="sc-spin" style={{ color: "var(--blue)" }} />}
                </div>
                {strategy ? (
                  <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    <p className="sc-ai-summary" style={{ flex: 1, margin: 0 }}>&ldquo;{strategy.summary}&rdquo;</p>
                    <div style={{ minWidth: "220px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--blue)", marginBottom: "7px" }}>Next Steps</div>
                      <div className="sc-ai-steps">
                        {strategy.plan.map((step, i) => (
                          <div key={i} className="sc-ai-step">
                            <CheckCircle2 size={11} color="var(--blue)" />
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "var(--blue)", opacity: 0.7 }}>Analyzing case for optimal strategy...</p>
                )}
              </div>

              {/* Veteran Info */}
              {vet && (
                <div className="sc-card">
                  <div className="sc-card-header">
                    <span className="sc-card-title">Veteran Information</span>
                  </div>
                  <div className="sc-card-body">
                    <div className="sc-info-grid">
                      {[
                          { label: "Full Name", value: `${vet.first_name} ${vet.last_name}` },
                          { label: "Branch", value: vet.branch_of_service },
                          { label: "Service Period", value: vet.service_start_date && vet.service_end_date ? `${format(new Date(vet.service_start_date), "MMM yyyy")} – ${format(new Date(vet.service_end_date), "MMM yyyy")}` : "N/A" },
                          { label: "Discharge", value: vet.discharge_status },
                          { label: "Email", value: vet.email },
                          { label: "Site", value: caseData.site?.name },
                        ].map((f) => (
                        <div key={f.label}>
                          <div className="sc-info-label">{f.label}</div>
                          <div className="sc-info-value">{f.value || "—"}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Conditions */}
              <div className="sc-card">
                <div className="sc-card-header">
                  <span className="sc-card-title">Conditions ({conditions.length})</span>
                  <button className="sc-btn sc-btn-ghost sc-btn-sm">
                    <Heart size={12} /> Add
                  </button>
                </div>
                <div className="sc-card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {conditions.length === 0 ? (
                    <div className="sc-empty"><Heart size={28} className="sc-empty-icon" /><span className="sc-empty-text">No conditions yet</span></div>
                  ) : (
                    conditions.map((cond) => (
                      <div key={cond.id} className="sc-condition">
                        <div className="sc-cond-header">
                          <div>
                            <span className="sc-cond-name">{cond.name}</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "5px", flexWrap: "wrap" }}>
                              <span className={getCondStatusPill(cond.status)}>{cond.status}</span>
                              {cond.conflict_flags && cond.conflict_flags.length > 0 && (
                                <span className="sc-pill sc-pill-red"><AlertTriangle size={8} /> {cond.conflict_flags.length} conflict{cond.conflict_flags.length > 1 ? "s" : ""}</span>
                              )}
                            </div>
                          </div>
                          <div className="sc-cond-actions">
                            <div style={{ textAlign: "right" }}>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-ghost)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Confidence</div>
                              <div style={{ fontFamily: "var(--display)", fontSize: "20px", letterSpacing: "0.04em", color: cond.confidence >= 0.8 ? "var(--green)" : cond.confidence >= 0.5 ? "var(--gold-bright)" : "var(--red)" }}>
                                {Math.round(cond.confidence * 100)}%
                              </div>
                            </div>
                            {cond.status === "draft" && (
                              <>
                                <button className="sc-btn sc-btn-green sc-btn-sm" onClick={() => handleApproveCondition(cond.id)}>
                                  <CheckCircle2 size={11} /> Approve
                                </button>
                                <button className="sc-btn sc-btn-red sc-btn-sm" onClick={() => handleRejectCondition(cond.id)}>
                                  <XCircle size={11} /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                        {cond.ai_summary && (
                          <div className="sc-cond-ai">
                            <div className="sc-cond-ai-label">AI Draft Summary</div>
                            {cond.ai_summary}
                          </div>
                        )}
                        {cond.symptoms && cond.symptoms.length > 0 && (
                          <div className="sc-symptoms">
                            {cond.symptoms.map((s: string) => <span key={s} className="sc-symptom">{s}</span>)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="sc-col-stack">
              {/* Readiness */}
              <div className="sc-card">
                <div className="sc-card-header">
                  <span className="sc-card-title">Packet Readiness</span>
                </div>
                <div className="sc-score-wrap">
                  <div className="sc-score-ring">
                    <svg width="100" height="100" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={getReadinessColor(caseData.packet_readiness_score)}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 42}`}
                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - caseData.packet_readiness_score / 100)}`}
                        style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 6px ${getReadinessColor(caseData.packet_readiness_score)})` }}
                      />
                    </svg>
                    <div className="sc-score-inner">
                      <span className="sc-score-num" style={{ color: getReadinessColor(caseData.packet_readiness_score) }}>
                        {caseData.packet_readiness_score}
                      </span>
                      <span className="sc-score-lbl">Ready</span>
                    </div>
                  </div>
                  <div className="sc-metrics">
                    {[
                      { label: "Intake", value: caseData.intake_completeness },
                      { label: "Citations", value: caseData.citation_coverage },
                    ].map((m) => (
                      <div key={m.label} className="sc-metric-row">
                        <span className="sc-metric-label">{m.label}</span>
                        <div className="sc-metric-bar">
                          <div className={`sc-metric-fill ${getMetricClass(m.value)}`} style={{ width: `${m.value}%` }} />
                        </div>
                        <span className={`sc-metric-val`} style={{ color: getReadinessColor(m.value) }}>{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="sc-card">
                <div className="sc-card-header">
                  <span className="sc-card-title">Quick Actions</span>
                </div>
                <div className="sc-card-body" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {[
                    { icon: FileText, label: "Evidence Library", href: "/staff/evidence" },
                    { icon: BookOpen, label: "VASRD Explorer", href: "/staff/vasrd" },
                    { icon: Search, label: "Gap Analysis", href: "/staff/gaps" },
                    { icon: Package, label: "Build Packet", href: "/staff/packets" },
                  ].map((a) => (
                    <Link key={a.label} href={a.href} className="sc-quick-action">
                      <a.icon size={14} color="var(--text-ghost)" />
                      <span>{a.label}</span>
                      <ExternalLink size={12} />
                    </Link>
                  ))}
                </div>
              </div>

              {/* SLA */}
              {caseData.sla_due_at && (
                <div className={`sc-sla ${isOverdue ? "overdue" : "ok"}`}>
                  <div className="sc-sla-label">SLA Deadline</div>
                  <div className={`sc-sla-date ${isOverdue ? "overdue" : "ok"}`}>
                    {format(new Date(caseData.sla_due_at), "MMM d, yyyy")}
                  </div>
                  {isOverdue && <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--red)", marginTop: "4px", letterSpacing: "0.1em" }}>OVERDUE</div>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS ── */}
        {activeTab === "documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="sc-card">
              <div className="sc-card-header">
                <span className="sc-card-title">Veteran Documents</span>
                <span className="sc-pill sc-pill-gray">{documents.length}</span>
              </div>
              {documents.length === 0 ? (
                <div className="sc-empty"><Upload size={28} className="sc-empty-icon" /><span className="sc-empty-text">No documents uploaded</span></div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="sc-doc-item">
                    <div className="sc-doc-icon" style={{
                      background: doc.category === "personal_statement" ? "rgba(167,139,250,0.12)" : doc.category === "va_notes" ? "var(--blue-dim)" : "rgba(255,255,255,0.05)",
                    }}>
                      <FileText size={16} color={doc.category === "personal_statement" ? "var(--purple)" : doc.category === "va_notes" ? "var(--blue)" : "var(--text-dim)"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="sc-doc-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</div>
                      <div className="sc-doc-meta">
                        {(doc.category || "other").replace(/_/g, " ")} · {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </div>
                    </div>
                    <span className={`sc-pill ${doc.processing_status === "complete" ? "sc-pill-green" : doc.processing_status === "extracting" ? "sc-pill-gold" : "sc-pill-gray"}`}>
                      {doc.processing_status === "complete" ? "Processed" : doc.processing_status || "Pending"}
                    </span>
                    {doc.storage_path && (
                      <button className="sc-btn sc-btn-ghost sc-btn-sm" onClick={async () => {
                        const { data } = await supabase.storage.from("veteran-documents").createSignedUrl(doc.storage_path, 300);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>
                        <Eye size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── TASKS ── */}
        {activeTab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--text-ghost)" }}>
                {tasks.length} Total Tasks
              </div>
              <button className="sc-btn sc-btn-gold sc-btn-sm" onClick={() => setShowTaskPicker(!showTaskPicker)}>
                <Plus size={12} /> Send Task
              </button>
            </div>

            {showTaskPicker && (
              <div className="sc-task-picker">
                <div className="sc-task-picker-title">Select task to send to veteran</div>
                <div className="sc-task-picker-grid">
                  {TASK_TEMPLATES.map((t) => (
                    <button key={t.title} className="sc-task-pick-btn" onClick={() => handleSendTask(t)} disabled={sendingTask !== null}>
                      <div className="sc-task-pick-title">
                        {sendingTask === t.title ? <Loader2 size={13} className="sc-spin" color="var(--blue)" /> : <Send size={13} color="var(--blue)" />}
                        {t.title}
                      </div>
                      <div className="sc-task-pick-desc">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="sc-card">
              {tasks.length === 0 ? (
                <div className="sc-empty"><CheckCircle2 size={28} className="sc-empty-icon" /><span className="sc-empty-text">No tasks assigned</span></div>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="sc-task-item">
                    <div className="sc-task-icon" style={{
                      background: task.status === "completed" ? "var(--green-dim)" : task.status === "sent" ? "rgba(167,139,250,0.12)" : "var(--blue-dim)",
                    }}>
                      {task.status === "completed"
                        ? <CheckCircle2 size={14} color="var(--green)" />
                        : <Clock size={14} color={task.status === "sent" ? "var(--purple)" : "var(--blue)"} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className={`sc-task-name${task.status === "completed" ? " done" : ""}`}>{task.title}</div>
                      {task.description && <div className="sc-task-desc">{task.description}</div>}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <span className={`sc-pill ${task.status === "completed" ? "sc-pill-green" : task.status === "sent" ? "sc-pill-purple" : task.status === "in_progress" ? "sc-pill-blue" : "sc-pill-gold"}`}>
                        {task.status === "completed" ? "Done" : task.status === "sent" ? "Sent" : task.status === "in_progress" ? "Active" : "Pending"}
                      </span>
                      {task.due_date && !task.completed_at && (
                        <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-ghost)", marginTop: "4px" }}>
                          Due {format(new Date(task.due_date), "MMM d")}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES ── */}
        {activeTab === "messages" && (
          <div className="sc-messages-wrap">
            <div className="sc-msg-header">
              <div style={{ fontFamily: "var(--cond)", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text)" }}>
                  Messages — {vet ? `${vet.first_name} ${vet.last_name}` : "Veteran"}
              </div>
            </div>

            <div className="sc-msg-list">
              {messages.length === 0 ? (
                <div className="sc-empty" style={{ height: "100%" }}>
                  <MessageSquare size={28} className="sc-empty-icon" />
                  <span className="sc-empty-text">No messages yet</span>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} style={{ display: "flex", justifyContent: msg.sender_type === "staff" ? "flex-end" : "flex-start" }}>
                    <div className={`sc-msg-bubble ${msg.sender_type}`}>
                      <div className="sc-msg-meta">
                        {msg.sender_name} · {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </div>
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {smartReplies.length > 0 && (
              <div className="sc-smart-replies">
                <div className="sc-smart-label"><Zap size={10} /> AI Suggested Replies</div>
                <div className="sc-smart-chips">
                  {smartReplies.map((r, i) => (
                    <button key={i} className="sc-smart-chip" onClick={() => { setNewMessage(r.message); setSmartReplies([]); }}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form className="sc-msg-form" onSubmit={handleSendMessage}>
              <button type="button" onClick={handleSmartReply} disabled={smartReplyLoading}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue)", padding: "4px", flexShrink: 0, display: "flex", alignItems: "center" }}>
                {smartReplyLoading ? <Loader2 size={16} className="sc-spin" /> : <Zap size={16} />}
              </button>
              <textarea
                className="sc-textarea"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Message the veteran..."
                rows={1}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
              />
              <button className="sc-btn sc-btn-gold sc-btn-sm" type="submit" disabled={!newMessage.trim() || sendingMessage}>
                {sendingMessage ? <Loader2 size={13} className="sc-spin" /> : <Send size={13} />}
              </button>
            </form>
          </div>
        )}

        {/* ── AI TOOLS ── */}
        {activeTab === "ai-tools" && (
          <div className="sc-ai-grid">
            {/* Narrative */}
            <div className="sc-ai-tool">
              <div className="sc-ai-tool-header">
                <div className="sc-ai-tool-icon" style={{ background: "rgba(167,139,250,0.12)" }}>
                  <FileSignature size={18} color="var(--purple)" />
                </div>
                <div>
                  <div className="sc-ai-tool-name">Case Narrative</div>
                  <div className="sc-ai-tool-desc">Generate comprehensive case summary for packet</div>
                </div>
              </div>
              <div className="sc-ai-tool-body">
                <button className="sc-btn sc-btn-purple" style={{ width: "100%" }} onClick={handleGenerateNarrative} disabled={narrativeLoading}>
                  {narrativeLoading ? <><Loader2 size={13} className="sc-spin" /> Generating...</> : <><Sparkles size={13} /> Generate Narrative</>}
                </button>
                {narrative && (
                  <div className="sc-ai-result">
                    <div className="sc-ai-result-label" style={{ color: "var(--purple)" }}>
                      Generated Narrative
                      <button className="sc-copy-btn" onClick={() => { navigator.clipboard.writeText(narrative); toast.success("Copied"); }}>
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                    <pre>{narrative}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="sc-ai-tool">
              <div className="sc-ai-tool-header">
                <div className="sc-ai-tool-icon" style={{ background: "var(--green-dim)" }}>
                  <TrendingUp size={18} color="var(--green)" />
                </div>
                <div>
                  <div className="sc-ai-tool-name">Rating Estimator</div>
                  <div className="sc-ai-tool-desc">Predict VA disability rating from evidence</div>
                </div>
              </div>
              <div className="sc-ai-tool-body">
                <button className="sc-btn sc-btn-green" style={{ width: "100%" }} onClick={handleEstimateRating} disabled={ratingLoading}>
                  {ratingLoading ? <><Loader2 size={13} className="sc-spin" /> Analyzing...</> : <><Brain size={13} /> Estimate Rating</>}
                </button>
                {ratingData && (
                  <div style={{ marginTop: "12px" }}>
                    <div className="sc-rating-hero">
                      <div className="sc-rating-num">{ratingData.estimated_combined_rating}%</div>
                      <div className="sc-rating-conf">{ratingData.confidence} confidence</div>
                    </div>
                    {ratingData.individual_ratings?.map((r: { condition: string; estimated_rating: number; evidence_strength: string; rationale: string }, i: number) => (
                      <div key={i} className="sc-rating-row">
                        <div>
                          <div className="sc-rating-cond">{r.condition}</div>
                          <div className="sc-rating-rationale">{r.rationale}</div>
                        </div>
                        <span className={`sc-pill ${r.evidence_strength === "strong" ? "sc-pill-green" : r.evidence_strength === "moderate" ? "sc-pill-gold" : "sc-pill-red"}`}>
                          {r.estimated_rating}%
                        </span>
                      </div>
                    ))}
                    {ratingData.disclaimer && (
                      <p style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-ghost)", marginTop: "10px", letterSpacing: "0.06em" }}>{ratingData.disclaimer}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Nexus */}
            <div className="sc-ai-tool">
              <div className="sc-ai-tool-header">
                <div className="sc-ai-tool-icon" style={{ background: "var(--blue-dim)" }}>
                  <FileText size={18} color="var(--blue)" />
                </div>
                <div>
                  <div className="sc-ai-tool-name">Nexus Letter Drafter</div>
                  <div className="sc-ai-tool-desc">Generate nexus letter templates for the veteran&apos;s doctor</div>
                </div>
              </div>
              <div className="sc-ai-tool-body">
                {conditions.length === 0 ? (
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", textAlign: "center", padding: "1rem 0" }}>No conditions to generate letters for.</p>
                ) : (
                  conditions.map((cond) => (
                    <button key={cond.id} className="sc-nexus-btn" onClick={() => handleGenerateNexus(cond.id)} disabled={nexusLoading !== null}>
                      {nexusLoading === cond.id
                        ? <Loader2 size={14} className="sc-spin" color="var(--blue)" style={{ flexShrink: 0 }} />
                        : <FileSignature size={14} color="var(--blue)" style={{ flexShrink: 0 }} />}
                      <div>
                        <div className="sc-nexus-btn-name">{cond.name}</div>
                        <div className="sc-nexus-btn-hint">Generate nexus letter</div>
                      </div>
                    </button>
                  ))
                )}
                {nexusLetter && (
                  <div className="sc-ai-result">
                    <div className="sc-ai-result-label" style={{ color: "var(--blue)" }}>
                      {nexusLetter.conditionName}
                      <button className="sc-copy-btn" onClick={() => { navigator.clipboard.writeText(nexusLetter.letter); toast.success("Copied"); }}>
                        <Copy size={10} /> Copy
                      </button>
                    </div>
                    <pre>{nexusLetter.letter}</pre>
                  </div>
                )}
              </div>
            </div>

            {/* Secondary Conditions */}
            <div className="sc-ai-tool">
              <div className="sc-ai-tool-header">
                <div className="sc-ai-tool-icon" style={{ background: "rgba(251,146,60,0.1)" }}>
                  <Lightbulb size={18} color="var(--amber)" />
                </div>
                <div>
                  <div className="sc-ai-tool-name">Secondary Conditions</div>
                  <div className="sc-ai-tool-desc">AI finds additional conditions the veteran may claim</div>
                </div>
              </div>
              <div className="sc-ai-tool-body">
                <button className="sc-btn sc-btn-amber" style={{ width: "100%" }} onClick={handleSuggestSecondary} disabled={secondaryLoading}>
                  {secondaryLoading ? <><Loader2 size={13} className="sc-spin" /> Analyzing...</> : <><Lightbulb size={13} /> Find Secondary Conditions</>}
                </button>
                {secondarySuggestions.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {secondarySuggestions.map((s, i) => (
                      <div key={i} className="sc-secondary-item">
                        <div className="sc-secondary-header">
                          <span className="sc-secondary-name">{s.condition_name}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="sc-pill sc-pill-amber">{s.type}</span>
                            <button className="sc-btn sc-btn-ghost sc-btn-sm" onClick={() => handleAddSecondaryCondition(s)}>
                              <Plus size={11} /> Add
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-dim)" }}>{s.rationale}</p>
                        {s.evidence_needed && <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--amber)", marginTop: "5px" }}>Needs: {s.evidence_needed}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── DOC INTEL ── */}
        {activeTab === "doc-intel" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Header */}
            <div className="sc-card" style={{ background: "rgba(77,166,255,0.04)", borderColor: "rgba(77,166,255,0.18)" }}>
              <div className="sc-card-body" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "rgba(77,166,255,0.12)", border: "1px solid rgba(77,166,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Zap size={18} color="var(--blue)" />
                  </div>
                  <div>
                    <div className="sc-card-title">Document Intelligence Feed</div>
                    <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "2px" }}>
                      AI-extracted insights from uploaded documents
                    </div>
                  </div>
                </div>
                <button
                  className="sc-btn sc-btn-gold sc-btn-sm"
                  onClick={async () => {
                    if (docIntelLoading || !caseData) return;
                    setDocIntelLoading(true);
                    try {
                      const res = await fetch("/api/ai/document-intelligence", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ caseId: caseData.id }),
                      });
                      const data = await res.json();
                      if (data.insights) {
                        setDocIntel(data);
                        toast.success(`Found ${data.insights.length} insights`);
                      }
                    } catch {
                      toast.error("Failed to analyze documents");
                    }
                    setDocIntelLoading(false);
                  }}
                  disabled={docIntelLoading}
                >
                  {docIntelLoading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Analyzing...</> : <><Zap size={13} /> Analyze Documents</>}
                </button>
              </div>
            </div>

            {docIntel && docIntel.summary && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "var(--border)", borderRadius: "6px", overflow: "hidden" }}>
                {[
                  { val: docIntel.summary.totalFindings, label: "Total Findings" },
                  { val: docIntel.summary.highSignificance, label: "High Priority" },
                  { val: docIntel.summary.conditionsCovered, label: "Conditions" },
                  { val: docIntel.summary.documentsAnalyzed, label: "Docs Analyzed" },
                ].map((s, i) => (
                  <div key={i} style={{ background: "var(--surface-2)", padding: "16px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--display)", fontSize: "24px", color: "var(--text)", letterSpacing: "0.04em" }}>{s.val}</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-ghost)", marginTop: "3px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {docIntel && Array.isArray(docIntel.insights) && docIntel.insights.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {docIntel.insights.map((insight: Record<string, unknown>, i: number) => {
                  const typeColors: Record<string, { bg: string; color: string; icon: typeof FileText }> = {
                    diagnosis_found: { bg: "var(--green-dim)", color: "var(--green)", icon: CheckCircle2 },
                    nexus_detected: { bg: "var(--gold-dim)", color: "var(--gold-bright)", icon: Lightbulb },
                    treatment_gap: { bg: "var(--red-dim)", color: "var(--red)", icon: AlertTriangle },
                    service_event: { bg: "var(--blue-dim)", color: "var(--blue)", icon: Shield },
                    symptom_mention: { bg: "rgba(167,139,250,0.12)", color: "#a78bfa", icon: Heart },
                    medication_found: { bg: "var(--green-dim)", color: "var(--green)", icon: FileText },
                    specialist_referral: { bg: "var(--blue-dim)", color: "var(--blue)", icon: ExternalLink },
                    rating_relevant: { bg: "var(--gold-dim)", color: "var(--gold-bright)", icon: TrendingUp },
                  };
                  const style = typeColors[insight.type as string] || typeColors.symptom_mention;
                  const Icon = style.icon;

                  return (
                    <div key={i} className="sc-card" style={{ transition: "border-color 0.15s" }}>
                      <div className="sc-card-body" style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "6px", background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={15} color={style.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>{insight.title as string}</span>
                            <span className={`sc-pill`} style={{ background: style.bg, color: style.color, border: "none", fontSize: "9px" }}>
                              {(insight.type as string).replace(/_/g, " ")}
                            </span>
                            {insight.significance === "high" && (
                              <span className="sc-pill sc-pill-amber" style={{ fontSize: "9px" }}>HIGH</span>
                            )}
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>{insight.detail as string}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-ghost)" }}>
                              {insight.documentName as string}
                            </span>
                            {insight.conditionLink && String(insight.conditionLink) !== "null" ? (
                              <span className="sc-pill" style={{ background: "var(--gold-dim)", color: "var(--gold-bright)", border: "none", fontSize: "9px" }}>
                                {String(insight.conditionLink)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : !docIntel ? (
              <div className="sc-card">
                <div className="sc-card-body" style={{ textAlign: "center", padding: "3rem", color: "var(--text-ghost)" }}>
                  <Zap size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p>Click &ldquo;Analyze Documents&rdquo; to extract AI insights from uploaded files.</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
