"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Case, CASE_STATUS_LABELS } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = `
  .db-shell {
    padding: 1.5rem;
    font-family: 'Barlow', sans-serif;
    color: #cdd5e0;
    min-height: 100%;
  }
  .db-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 34px;
    letter-spacing: 0.06em;
    color: #cdd5e0;
    line-height: 1;
  }
  .db-subtitle {
    font-size: 13px;
    color: rgba(205,213,224,0.45);
    margin-top: 4px;
  }
  .db-select {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 4px;
    padding: 8px 12px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: rgba(205,213,224,0.6);
    outline: none;
    cursor: pointer;
    text-transform: uppercase;
  }
  .db-select:focus { border-color: rgba(212,168,67,0.4); }
  .db-select option { background: #0d1420; color: #cdd5e0; }

  .db-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: rgba(255,255,255,0.07); border-radius: 6px; overflow: hidden; }
  @media (max-width: 768px) { .db-kpi-grid { grid-template-columns: repeat(2,1fr); } }
  .db-kpi {
    background: #111927;
    padding: 1.25rem 1.5rem;
    position: relative;
  }
  .db-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent);
  }
  .db-kpi-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(205,213,224,0.35);
    margin-bottom: 8px;
  }
  .db-kpi-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    letter-spacing: 0.04em;
    line-height: 1;
    color: #cdd5e0;
  }
  .db-kpi-value.green { color: #3ecf8e; }
  .db-kpi-value.red { color: #f56565; }
  .db-kpi-value.purple { color: #a78bfa; }

  .db-card {
    background: #111927;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    padding: 1.25rem 1.5rem;
    position: relative;
    overflow: hidden;
  }
  .db-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent);
    pointer-events: none;
  }
  .db-card-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #cdd5e0;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .db-card-title svg { color: rgba(205,213,224,0.35); }

  .db-pipeline-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .db-pipeline-label {
    width: 120px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    color: rgba(205,213,224,0.5);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .db-pipeline-bar {
    flex: 1;
    height: 26px;
    background: rgba(255,255,255,0.04);
    border-radius: 3px;
    overflow: hidden;
    position: relative;
  }
  .db-pipeline-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .db-pipeline-count {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: rgba(205,213,224,0.6);
  }

  .db-site-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 6px;
    padding: 1rem;
    margin-bottom: 12px;
  }
  .db-site-card:last-child { margin-bottom: 0; }
  .db-site-name { font-weight: 600; color: #cdd5e0; font-size: 14px; }
  .db-site-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    padding: 2px 6px;
    background: rgba(212,168,67,0.12);
    color: #f0c958;
    border: 1px solid rgba(212,168,67,0.2);
    border-radius: 2px;
  }
  .db-site-stat-value { font-size: 20px; font-weight: 700; color: #cdd5e0; }
  .db-site-stat-label { font-size: 11px; color: rgba(205,213,224,0.4); }

  .db-metric-box {
    text-align: center;
    padding: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 6px;
  }
  .db-metric-value {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    letter-spacing: 0.04em;
    color: #cdd5e0;
  }
  .db-metric-label {
    font-size: 11px;
    color: rgba(205,213,224,0.4);
    margin-top: 2px;
  }
`;

export default function DashboardPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [siteFilter, setSiteFilter] = useState("all");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("cases")
      .select("*, veteran:veterans(*), site:sites(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCases((data as Case[]) || []));
  }, []);

  const filtered = siteFilter === "all" ? cases : cases.filter((c) => c.site?.slug === siteFilter);

  const statusCounts = filtered.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgReadiness = filtered.length
    ? Math.round(filtered.reduce((s, c) => s + c.packet_readiness_score, 0) / filtered.length)
    : 0;
  const avgCitation = filtered.length
    ? Math.round(filtered.reduce((s, c) => s + c.citation_coverage, 0) / filtered.length)
    : 0;
  const avgIntake = filtered.length
    ? Math.round(filtered.reduce((s, c) => s + c.intake_completeness, 0) / filtered.length)
    : 0;
  const overdueCount = filtered.filter((c) => c.sla_due_at && new Date(c.sla_due_at) < new Date()).length;

  const pipelineStages = [
    { key: "intake_pending", color: "bg-yellow-500" },
    { key: "intake_in_progress", color: "bg-blue-400" },
    { key: "intake_complete", color: "bg-indigo-500" },
    { key: "processing", color: "bg-purple-500" },
    { key: "review", color: "bg-orange-500" },
    { key: "packet_building", color: "bg-cyan-500" },
    { key: "ready_for_export", color: "bg-green-500" },
    { key: "exported", color: "bg-emerald-600" },
  ];

  const pipelineColors: Record<string, string> = {
    intake_pending: "#f0c958",
    intake_in_progress: "#4da6ff",
    intake_complete: "#818cf8",
    processing: "#a78bfa",
    review: "#fb923c",
    packet_building: "#22d3ee",
    ready_for_export: "#3ecf8e",
    exported: "#059669",
  };

  const maxCount = Math.max(...pipelineStages.map((s) => statusCounts[s.key] || 0), 1);

  return (
    <div className="db-shell">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="db-title">Dashboard</div>
          <div className="db-subtitle">Organization-wide metrics and insights</div>
        </div>
        <select className="db-select" value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
          <option value="all">All Sites (Roll-up)</option>
          <option value="houston">Houston Office</option>
          <option value="dallas">Dallas Office</option>
          <option value="san-antonio">San Antonio Office</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="db-kpi-grid mb-6">
        {[
          { label: "Total Cases", value: filtered.length, cls: "" },
          { label: "Avg Readiness", value: `${avgReadiness}%`, cls: "green" },
          { label: "SLA Overdue", value: overdueCount, cls: "red" },
          { label: "Avg Citation Coverage", value: `${avgCitation}%`, cls: "purple" },
        ].map((kpi) => (
          <div key={kpi.label} className="db-kpi">
            <div className="db-kpi-label">{kpi.label}</div>
            <div className={`db-kpi-value ${kpi.cls}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Pipeline chart */}
        <div className="db-card">
          <div className="db-card-title">
            <BarChart3 className="h-4 w-4" /> Case Pipeline
          </div>
          {pipelineStages.map((stage) => {
            const count = statusCounts[stage.key] || 0;
            return (
              <div key={stage.key} className="db-pipeline-row">
                <div className="db-pipeline-label">
                  {CASE_STATUS_LABELS[stage.key as keyof typeof CASE_STATUS_LABELS]}
                </div>
                <div className="db-pipeline-bar">
                  <div
                    className="db-pipeline-fill"
                    style={{
                      width: `${(count / maxCount) * 100}%`,
                      minWidth: count > 0 ? "24px" : "0",
                      background: pipelineColors[stage.key] || "#4da6ff",
                    }}
                  />
                  <span className="db-pipeline-count">{count}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Site breakdown */}
        <div className="db-card">
          <div className="db-card-title">
            <Users className="h-4 w-4" /> Site Performance
          </div>
          {["houston", "dallas", "san-antonio"].map((slug) => {
            const siteCases = cases.filter((c) => c.site?.slug === slug);
            const siteAvg = siteCases.length
              ? Math.round(siteCases.reduce((s, c) => s + c.packet_readiness_score, 0) / siteCases.length)
              : 0;
            const siteOverdue = siteCases.filter((c) => c.sla_due_at && new Date(c.sla_due_at) < new Date()).length;
            const siteName = slug === "san-antonio" ? "San Antonio" : slug.charAt(0).toUpperCase() + slug.slice(1);

            return (
              <div key={slug} className="db-site-card">
                <div className="flex items-center justify-between mb-3">
                  <span className="db-site-name">{siteName} Office</span>
                  <span className="db-site-badge">{siteCases.length} CASES</span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="db-site-stat-value">{siteAvg}%</div>
                    <div className="db-site-stat-label">Avg Readiness</div>
                  </div>
                  <div>
                    <div className="db-site-stat-value" style={siteOverdue > 0 ? { color: "#f56565" } : {}}>
                      {siteOverdue}
                    </div>
                    <div className="db-site-stat-label">Overdue</div>
                  </div>
                  <div>
                    <div className="db-site-stat-value">
                      {siteCases.length
                        ? Math.round(siteCases.reduce((s, c) => s + c.intake_completeness, 0) / siteCases.length)
                        : 0}%
                    </div>
                    <div className="db-site-stat-label">Intake Avg</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Throughput */}
      <div className="db-card">
        <div className="db-card-title">
          <Clock className="h-4 w-4" /> Throughput & Metrics
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: "Avg Intake Completion", value: `${avgIntake}%` },
            { label: "Avg Citation Coverage", value: `${avgCitation}%` },
            { label: "Cases in Review", value: statusCounts["review"] || 0 },
            { label: "Packets Built", value: statusCounts["exported"] || 0 },
            { label: "Processing Queue", value: statusCounts["processing"] || 0 },
          ].map((m) => (
            <div key={m.label} className="db-metric-box">
              <div className="db-metric-value">{m.value}</div>
              <div className="db-metric-label">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
