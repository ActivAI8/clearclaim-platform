"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Case } from "@/lib/types";
import {
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = `
  .rp-shell { padding: 1.5rem; font-family: 'Barlow', sans-serif; color: #cdd5e0; min-height: 100%; }
  .rp-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 0.06em; color: #cdd5e0; line-height: 1; }
  .rp-subtitle { font-size: 13px; color: rgba(205,213,224,0.45); margin-top: 4px; }
  .rp-select {
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
    padding: 8px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.06em;
    color: rgba(205,213,224,0.6); outline: none; cursor: pointer; text-transform: uppercase;
  }
  .rp-select:focus { border-color: rgba(212,168,67,0.4); }
  .rp-select option { background: #0d1420; color: #cdd5e0; }
  .rp-btn {
    display: flex; align-items: center; gap: 6px; padding: 8px 16px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
    color: rgba(205,213,224,0.6); cursor: pointer; text-transform: uppercase; transition: all 0.15s;
  }
  .rp-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .rp-kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 1px; background: rgba(255,255,255,0.07); border-radius: 6px; overflow: hidden; }
  @media (max-width: 768px) { .rp-kpi-grid { grid-template-columns: repeat(2,1fr); } }
  .rp-kpi { background: #111927; padding: 1.25rem 1.5rem; position: relative; }
  .rp-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent); }
  .rp-kpi-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(205,213,224,0.35); margin-bottom: 8px; }
  .rp-kpi-value { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 0.04em; line-height: 1; color: #cdd5e0; }
  .rp-card {
    background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px;
    padding: 1.25rem 1.5rem; position: relative; overflow: hidden;
  }
  .rp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent); pointer-events: none; }
  .rp-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd5e0; margin-bottom: 1rem; }
  .rp-site-name { font-size: 14px; font-weight: 500; color: #cdd5e0; }
  .rp-site-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.4); }
  .rp-bar-label { font-size: 11px; color: rgba(205,213,224,0.5); }
  .rp-bar-value { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.5); }
  .rp-bar-track { height: 6px; border-radius: 3px; background: rgba(255,255,255,0.06); overflow: hidden; }
  .rp-bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  .rp-item-label { font-size: 13px; color: #cdd5e0; }
  .rp-item-rate { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: rgba(205,213,224,0.5); }
`;

export default function ReportsPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [siteFilter, setSiteFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from("cases")
      .select("*, site:sites(*)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCases((data as Case[]) || []));
  }, []);

  const filtered = siteFilter === "all" ? cases : cases.filter((c) => c.site?.slug === siteFilter);

  const metrics = {
    totalCases: filtered.length,
    avgCycleTime: "4.2 days",
    avgReadiness: filtered.length ? Math.round(filtered.reduce((s, c) => s + c.packet_readiness_score, 0) / filtered.length) : 0,
    exportedCount: filtered.filter((c) => c.status === "exported").length,
  };

  return (
    <div className="rp-shell">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="rp-title">Reports</div>
          <div className="rp-subtitle">Site and organization-level reporting</div>
        </div>
        <div className="flex items-center gap-3">
          <select className="rp-select" value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <select className="rp-select" value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)}>
            <option value="all">All Sites</option>
            <option value="houston">Houston</option>
            <option value="dallas">Dallas</option>
            <option value="san-antonio">San Antonio</option>
          </select>
          <button className="rp-btn">
            <Download size={13} /> Export Report
          </button>
        </div>
      </div>

      <div className="rp-kpi-grid mb-6">
        {[
          { label: "Total Cases", value: metrics.totalCases },
          { label: "Avg Cycle Time", value: metrics.avgCycleTime },
          { label: "Avg Readiness", value: `${metrics.avgReadiness}%` },
          { label: "Packets Exported", value: metrics.exportedCount },
        ].map((m) => (
          <div key={m.label} className="rp-kpi">
            <div className="rp-kpi-label">{m.label}</div>
            <div className="rp-kpi-value">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rp-card">
          <div className="rp-card-title">Site Comparison</div>
          <div className="space-y-5">
            {["houston", "dallas", "san-antonio"].map((slug) => {
              const sc = cases.filter((c) => c.site?.slug === slug);
              const name = slug === "san-antonio" ? "San Antonio" : slug.charAt(0).toUpperCase() + slug.slice(1);
              return (
                <div key={slug}>
                  <div className="flex justify-between mb-2">
                    <span className="rp-site-name">{name}</span>
                    <span className="rp-site-count">{sc.length} cases</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Intake", value: sc.length ? Math.round(sc.reduce((s, c) => s + c.intake_completeness, 0) / sc.length) : 0, color: "#4da6ff" },
                      { label: "Citations", value: sc.length ? Math.round(sc.reduce((s, c) => s + c.citation_coverage, 0) / sc.length) : 0, color: "#a78bfa" },
                      { label: "Readiness", value: sc.length ? Math.round(sc.reduce((s, c) => s + c.packet_readiness_score, 0) / sc.length) : 0, color: "#3ecf8e" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between mb-1">
                          <span className="rp-bar-label">{bar.label}</span>
                          <span className="rp-bar-value">{bar.value}%</span>
                        </div>
                        <div className="rp-bar-track">
                          <div className="rp-bar-fill" style={{ width: `${bar.value}%`, background: bar.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rp-card">
          <div className="rp-card-title">Missing Item Rates</div>
          <div className="space-y-4">
            {[
              { label: "Nexus Letters", rate: 42 },
              { label: "Functional Impact Assessments", rate: 35 },
              { label: "Buddy Statements", rate: 65 },
              { label: "Noise Exposure Documentation", rate: 28 },
              { label: "Treatment Continuity Gaps", rate: 22 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="rp-item-label">{item.label}</span>
                  <span className="rp-item-rate">{item.rate}%</span>
                </div>
                <div className="rp-bar-track">
                  <div
                    className="rp-bar-fill"
                    style={{
                      width: `${item.rate}%`,
                      background: item.rate > 40 ? "#f56565" : item.rate > 25 ? "#f0c958" : "#3ecf8e",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
