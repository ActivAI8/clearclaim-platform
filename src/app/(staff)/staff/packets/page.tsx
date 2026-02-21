"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Lock,
  History,
  Eye,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CaseOption { id: string; case_number: string; veteran_name: string; status: string; }

const STYLES = `
  .pk-shell { padding: 1.5rem; font-family: 'Barlow', sans-serif; color: #cdd5e0; min-height: 100%; }
  .pk-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 0.06em; color: #cdd5e0; line-height: 1; }
  .pk-subtitle { font-size: 13px; color: rgba(205,213,224,0.45); margin-top: 4px; }
  .pk-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 8px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.6); outline: none; cursor: pointer; min-width: 260px; }
  .pk-select option { background: #0d1420; color: #cdd5e0; }
  .pk-btn { display: flex; align-items: center; gap: 5px; padding: 7px 14px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; color: rgba(205,213,224,0.6); cursor: pointer; transition: all 0.12s; }
  .pk-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .pk-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pk-btn-primary { background: linear-gradient(135deg, #d4a843, #f0c958); color: #080c12; font-weight: 600; border: none; }
  .pk-btn-primary:hover:not(:disabled) { opacity: 0.9; color: #080c12; }
  .pk-card { background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 1.25rem 1.5rem; position: relative; overflow: hidden; }
  .pk-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent); pointer-events: none; }
  .pk-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd5e0; margin-bottom: 4px; }
  .pk-card-sub { font-size: 11px; color: rgba(205,213,224,0.35); }
  .pk-gate { border-radius: 6px; padding: 1.25rem; }
  .pk-gate-ready { background: rgba(62,207,142,0.06); border: 1px solid rgba(62,207,142,0.15); }
  .pk-gate-blocked { background: rgba(245,101,101,0.06); border: 1px solid rgba(245,101,101,0.15); }
  .pk-gate-title { font-weight: 600; font-size: 15px; color: #cdd5e0; }
  .pk-gate-desc { font-size: 13px; color: rgba(205,213,224,0.5); }
  .pk-progress { width: 100%; height: 8px; border-radius: 4px; background: rgba(255,255,255,0.06); overflow: hidden; margin-top: 12px; }
  .pk-progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
  .pk-section-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); }
  .pk-section-row:last-child { border-bottom: none; }
  .pk-section-name { font-size: 13px; font-weight: 500; color: #cdd5e0; }
  .pk-section-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
  .pk-badge-ready { background: rgba(62,207,142,0.12); color: #3ecf8e; border: 1px solid rgba(62,207,142,0.2); }
  .pk-badge-warning { background: rgba(212,168,67,0.12); color: #f0c958; border: 1px solid rgba(212,168,67,0.2); }
  .pk-badge-incomplete { background: rgba(245,101,101,0.1); color: #f56565; border: 1px solid rgba(245,101,101,0.2); }
  .pk-section-citations { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.3); }
  .pk-checkbox { width: 16px; height: 16px; accent-color: #d4a843; cursor: pointer; }
  .pk-check-item { display: flex; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 10px; }
  .pk-check-done { color: #cdd5e0; }
  .pk-check-pending { color: rgba(205,213,224,0.35); }
  .pk-unchecked { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); flex-shrink: 0; }
  .pk-export-item { border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 10px 12px; margin-bottom: 8px; }
  .pk-export-version { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; color: #cdd5e0; }
  .pk-export-format { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 5px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.07); border-radius: 2px; color: rgba(205,213,224,0.5); }
  .pk-export-meta { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.3); margin-top: 4px; }
  .pk-empty { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.3); }
`;

export default function PacketBuilderPage() {
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [caseData, setCaseData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [conditions, setConditions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [documents, setDocuments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exports, setExports] = useState<any[]>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string; included: boolean; status: string; citationCount: number }>>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadCases() {
      const { data } = await supabase.from("cases").select("id, case_number, status, veteran:veterans(first_name, last_name)").order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts = (data || []).map((c: any) => ({ id: c.id, case_number: c.case_number, veteran_name: c.veteran ? `${c.veteran.first_name} ${c.veteran.last_name}` : "Unknown", status: c.status }));
      setCases(opts);
      if (opts.length > 0) setSelectedCaseId(opts[0].id);
    }
    loadCases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCaseId) return;
    async function loadCaseData() {
      const [caseRes, condRes, docRes, exportRes] = await Promise.all([
        supabase.from("cases").select("*").eq("id", selectedCaseId).single(),
        supabase.from("conditions").select("*").eq("case_id", selectedCaseId).order("created_at"),
        supabase.from("documents").select("*").eq("case_id", selectedCaseId).order("created_at"),
        supabase.from("packet_exports").select("*").eq("case_id", selectedCaseId).order("created_at", { ascending: false }),
      ]);
      setCaseData(caseRes.data);
      setConditions(condRes.data || []);
      setDocuments(docRes.data || []);
      setExports(exportRes.data || []);
      const conds = condRes.data || [];
      const docs = docRes.data || [];
      const hasStatement = docs.some((d: { category: string }) => d.category === "personal_statement");
      const allApproved = conds.length > 0 && conds.every((c: { status: string }) => c.status === "approved");
      setSections([
        { id: "cover", name: "Cover Page & Case Summary", included: true, status: "ready", citationCount: 0 },
        { id: "evidence", name: "Evidence Index", included: true, status: docs.length > 0 ? "ready" : "incomplete", citationCount: docs.length * 4 },
        ...conds.map((c: { id: string; name: string; status: string; confidence: number }) => ({
          id: c.id, name: `${c.name} - Condition Summary`, included: true,
          status: c.status === "approved" ? "ready" : c.status === "rejected" ? "incomplete" : "warning",
          citationCount: Math.round(c.confidence * 10),
        })),
        { id: "statements", name: "Veteran-Provided Statements", included: true, status: hasStatement ? "ready" : "incomplete", citationCount: 0 },
        { id: "timeline", name: "Timeline Summary", included: true, status: allApproved ? "ready" : "warning", citationCount: conds.length * 3 },
      ]);
    }
    loadCaseData();
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const citationThreshold = 70;
  const currentCoverage = caseData?.citation_coverage || 0;
  const canExport = currentCoverage >= citationThreshold;
  const toggleSection = (id: string) => setSections((prev) => prev.map((s) => (s.id === id ? { ...s, included: !s.included } : s)));

  const readinessChecks = [
    { label: "Intake Complete", value: caseData?.intake_completeness >= 100 },
    { label: "All Conditions Reviewed", value: conditions.length > 0 && conditions.every((c) => c.status !== "draft") },
    { label: "Citation Threshold Met", value: canExport },
    { label: "No Unresolved Conflicts", value: conditions.every((c) => !c.conflict_flags || c.conflict_flags.length === 0) },
    { label: "Veteran Attestation", value: documents.some((d) => d.category === "personal_statement") },
  ];

  return (
    <div className="pk-shell">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="pk-title">Packet Builder</div>
          <div className="pk-subtitle">Assemble and export case packets with citation verification</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="pk-select" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.case_number} - {c.veteran_name}</option>)}
          </select>
          <button className="pk-btn"><Eye size={13} /> Preview</button>
          <button className="pk-btn"><Settings2 size={13} /> Template</button>
          <button className={cn("pk-btn", canExport && "pk-btn-primary")} disabled={!canExport} onClick={() => toast.success("Packet exported as PDF (demo)")}>
            <Download size={13} /> Export PDF
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Export gate */}
          <div className={cn("pk-gate", canExport ? "pk-gate-ready" : "pk-gate-blocked")}>
            <div className="flex items-center gap-3">
              {canExport ? <CheckCircle2 size={22} style={{ color: "#3ecf8e" }} /> : <Lock size={22} style={{ color: "#f56565" }} />}
              <div>
                <div className="pk-gate-title">{canExport ? "Export Ready" : "Export Blocked"}</div>
                <div className="pk-gate-desc">
                  Citation coverage: {currentCoverage}% (threshold: {citationThreshold}%)
                  {!canExport && " - Improve citation coverage before export is allowed."}
                </div>
              </div>
            </div>
            <div className="pk-progress">
              <div className="pk-progress-fill" style={{ width: `${currentCoverage}%`, background: canExport ? "#3ecf8e" : "#f56565" }} />
            </div>
          </div>

          {/* Packet sections */}
          <div className="pk-card">
            <div style={{ padding: "0 0 12px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "4px" }}>
              <div className="pk-card-title">Packet Sections ({sections.length})</div>
              <div className="pk-card-sub">Toggle sections to include in the final export.</div>
            </div>
            {sections.map((section) => (
              <div key={section.id} className="pk-section-row">
                <input type="checkbox" checked={section.included} onChange={() => toggleSection(section.id)} className="pk-checkbox" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="pk-section-name">{section.name}</span>
                    {section.status === "warning" && <span className="pk-section-badge pk-badge-warning"><AlertTriangle size={10} style={{ marginRight: 2 }} />Needs Review</span>}
                    {section.status === "incomplete" && <span className="pk-section-badge pk-badge-incomplete">Incomplete</span>}
                    {section.status === "ready" && <span className="pk-section-badge pk-badge-ready"><CheckCircle2 size={10} style={{ marginRight: 2 }} />Ready</span>}
                  </div>
                  {section.citationCount > 0 && <span className="pk-section-citations">{section.citationCount} citations</span>}
                </div>
                <button className="pk-btn" style={{ padding: "4px 8px" }}><Eye size={13} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Readiness */}
          <div className="pk-card">
            <div className="pk-card-title" style={{ marginBottom: "12px" }}>Packet Readiness</div>
            {readinessChecks.map((item) => (
              <div key={item.label} className="pk-check-item">
                {item.value ? <CheckCircle2 size={16} style={{ color: "#3ecf8e", flexShrink: 0 }} /> : <div className="pk-unchecked" />}
                <span className={item.value ? "pk-check-done" : "pk-check-pending"}>{item.label}</span>
              </div>
            ))}
          </div>

          {/* Export history */}
          <div className="pk-card">
            <div className="pk-card-title" style={{ marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <History size={14} style={{ color: "rgba(205,213,224,0.35)" }} /> Export History
            </div>
            {exports.length === 0 ? (
              <div className="pk-empty">No exports yet for this case.</div>
            ) : exports.map((exp) => (
              <div key={exp.id} className="pk-export-item">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} style={{ color: "rgba(205,213,224,0.35)" }} />
                    <span className="pk-export-version">v{exp.version}</span>
                    <span className="pk-export-format">{exp.format?.toUpperCase()}</span>
                  </div>
                  <button className="pk-btn" style={{ padding: "4px 8px" }}><Download size={13} /></button>
                </div>
                <div className="pk-export-meta">{new Date(exp.created_at).toLocaleString()}</div>
                <div className="pk-export-meta">Citation coverage: {exp.citation_coverage}%</div>
              </div>
            ))}
          </div>

          {/* Export formats */}
          <div className="pk-card">
            <div className="pk-card-title" style={{ marginBottom: "12px" }}>Export Formats</div>
            <button className="pk-btn" style={{ width: "100%", justifyContent: "flex-start", marginBottom: "8px" }} disabled={!canExport} onClick={() => toast.success("PDF export started (demo)")}>
              <FileText size={13} /> Export as PDF
            </button>
            <button className="pk-btn" style={{ width: "100%", justifyContent: "flex-start" }} disabled={!canExport} onClick={() => toast.success("DOCX export started (demo)")}>
              <FileText size={13} /> Export as DOCX
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
