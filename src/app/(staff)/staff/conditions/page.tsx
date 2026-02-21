"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Condition, Case } from "@/lib/types";
import {
  Heart,
  CheckCircle2,
  XCircle,
  Edit3,
  Merge,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const STYLES = `
  .cd-shell { padding: 1.5rem; font-family: 'Barlow', sans-serif; color: #cdd5e0; min-height: 100%; }
  .cd-title { font-family: 'Bebas Neue', sans-serif; font-size: 34px; letter-spacing: 0.06em; color: #cdd5e0; line-height: 1; }
  .cd-subtitle { font-size: 13px; color: rgba(205,213,224,0.45); margin-top: 4px; }
  .cd-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 3px 8px; border-radius: 2px; letter-spacing: 0.08em; text-transform: uppercase; }
  .cd-badge-draft { background: rgba(212,168,67,0.12); color: #f0c958; border: 1px solid rgba(212,168,67,0.2); }
  .cd-badge-approved { background: rgba(62,207,142,0.12); color: #3ecf8e; border: 1px solid rgba(62,207,142,0.2); }
  .cd-badge-conflict { background: rgba(245,101,101,0.1); color: #f56565; border: 1px solid rgba(245,101,101,0.2); }
  .cd-section-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(205,213,224,0.35); margin-bottom: 12px; }
  .cd-card { background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; overflow: hidden; margin-bottom: 10px; transition: border-color 0.15s; }
  .cd-card.conflict { border-color: rgba(245,101,101,0.25); }
  .cd-card-header { padding: 16px; cursor: pointer; transition: background 0.12s; }
  .cd-card-header:hover { background: rgba(255,255,255,0.02); }
  .cd-cond-icon { width: 40px; height: 40px; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cd-cond-icon.draft { background: rgba(212,168,67,0.12); }
  .cd-cond-icon.approved { background: rgba(62,207,142,0.12); }
  .cd-cond-name { font-size: 15px; font-weight: 600; color: #cdd5e0; }
  .cd-cond-meta { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.35); display: flex; align-items: center; gap: 12px; margin-top: 4px; }
  .cd-btn { display: flex; align-items: center; gap: 4px; padding: 5px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; color: rgba(205,213,224,0.6); cursor: pointer; transition: all 0.12s; }
  .cd-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .cd-btn-approve { border-color: rgba(62,207,142,0.3); color: #3ecf8e; }
  .cd-btn-approve:hover { background: rgba(62,207,142,0.12); }
  .cd-btn-reject { border-color: rgba(245,101,101,0.3); color: #f56565; }
  .cd-btn-reject:hover { background: rgba(245,101,101,0.1); }
  .cd-expand { background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.07); padding: 16px; }
  .cd-info-box { background: rgba(77,166,255,0.06); border: 1px solid rgba(77,166,255,0.12); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
  .cd-info-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #4da6ff; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .cd-conflict-box { background: rgba(245,101,101,0.06); border: 1px solid rgba(245,101,101,0.12); border-radius: 6px; padding: 12px; margin-bottom: 12px; }
  .cd-conflict-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: #f56565; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
  .cd-field-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(205,213,224,0.4); margin-bottom: 6px; }
  .cd-tag { font-size: 11px; padding: 3px 10px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 2px; color: rgba(205,213,224,0.7); }
  .cd-spinner { display: flex; align-items: center; justify-content: center; height: 24rem; }
  .cd-spin { width: 32px; height: 32px; border: 3px solid rgba(212,168,67,0.2); border-top-color: #d4a843; border-radius: 50%; animation: cdspin 0.7s linear infinite; }
  @keyframes cdspin { to { transform: rotate(360deg); } }
`;

export default function ConditionsPage() {
  const [conditions, setConditions] = useState<(Condition & { case?: Case })[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: cases } = await supabase.from("cases").select("*, veteran:veterans(*)");
      const { data: conds } = await supabase.from("conditions").select("*").order("created_at");
      if (conds && cases) {
        const merged = conds.map((c: Condition) => ({ ...c, case: (cases as Case[]).find((cs) => cs.id === c.case_id) }));
        setConditions(merged);
      }
      setLoading(false);
    }
    load();
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const grouped = {
    draft: conditions.filter((c) => c.status === "draft"),
    approved: conditions.filter((c) => c.status === "approved"),
  };

  if (loading) return <div className="cd-shell"><style>{STYLES}</style><div className="cd-spinner"><div className="cd-spin" /></div></div>;

  return (
    <div className="cd-shell">
      <style>{STYLES}</style>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="cd-title">Condition Cards</div>
          <div className="cd-subtitle">Review, approve, edit, and manage extracted conditions</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="cd-badge cd-badge-draft">{grouped.draft.length} Draft</span>
          <span className="cd-badge cd-badge-approved">{grouped.approved.length} Approved</span>
        </div>
      </div>

      {grouped.draft.length > 0 && (
        <div className="mb-6">
          <div className="cd-section-label">Pending Review ({grouped.draft.length})</div>
          {grouped.draft.map((cond) => (
            <ConditionCard key={cond.id} condition={cond} isExpanded={expanded.has(cond.id)} onToggle={() => toggle(cond.id)} />
          ))}
        </div>
      )}

      {grouped.approved.length > 0 && (
        <div>
          <div className="cd-section-label">Approved ({grouped.approved.length})</div>
          {grouped.approved.map((cond) => (
            <ConditionCard key={cond.id} condition={cond} isExpanded={expanded.has(cond.id)} onToggle={() => toggle(cond.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ConditionCard({ condition: cond, isExpanded, onToggle }: { condition: Condition & { case?: Case }; isExpanded: boolean; onToggle: () => void; }) {
  const hasConflict = cond.conflict_flags && cond.conflict_flags.length > 0;
  return (
    <div className={cn("cd-card", hasConflict && "conflict")}>
      <div className="cd-card-header" onClick={onToggle}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("cd-cond-icon", cond.status === "approved" ? "approved" : "draft")}>
              <Heart size={18} style={{ color: cond.status === "approved" ? "#3ecf8e" : "#f0c958" }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="cd-cond-name">{cond.name}</span>
                <span className={cn("cd-badge", cond.status === "approved" ? "cd-badge-approved" : "cd-badge-draft")}>{cond.status}</span>
                {hasConflict && <span className="cd-badge cd-badge-conflict"><AlertTriangle size={10} style={{ marginRight: 3 }} />Conflicts</span>}
              </div>
              <div className="cd-cond-meta">
                {cond.case && <span>{cond.case.case_number}</span>}
                {cond.onset_date && <span>Onset: {format(new Date(cond.onset_date), "MMM d, yyyy")}</span>}
                <span>Confidence: {Math.round(cond.confidence * 100)}%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cond.status === "draft" && (
              <>
                <button className="cd-btn cd-btn-approve" onClick={(e) => e.stopPropagation()}><CheckCircle2 size={14} /> Approve</button>
                <button className="cd-btn cd-btn-reject" onClick={(e) => e.stopPropagation()}><XCircle size={14} /> Reject</button>
              </>
            )}
            <button className="cd-btn" onClick={(e) => e.stopPropagation()}><Edit3 size={14} /></button>
            {isExpanded ? <ChevronUp size={16} style={{ color: "rgba(205,213,224,0.35)" }} /> : <ChevronDown size={16} style={{ color: "rgba(205,213,224,0.35)" }} />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="cd-expand">
          {cond.ai_summary && (
            <div className="cd-info-box">
              <div className="cd-info-label"><FileText size={11} /> AI Draft Summary</div>
              <p style={{ fontSize: "13px", color: "rgba(205,213,224,0.7)", lineHeight: 1.6 }}>{cond.ai_summary}</p>
            </div>
          )}
          {hasConflict && (
            <div className="cd-conflict-box">
              <div className="cd-conflict-label"><AlertTriangle size={11} /> Contradiction Radar</div>
              {cond.conflict_flags!.map((flag, i) => (
                <p key={i} style={{ fontSize: "13px", color: "rgba(205,213,224,0.7)", lineHeight: 1.6 }}>{flag.description}</p>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="cd-field-label">Symptoms</div>
              <div className="flex flex-wrap gap-2">{cond.symptoms?.map((s) => <span key={s} className="cd-tag">{s}</span>)}</div>
            </div>
            <div>
              <div className="cd-field-label">Treatments</div>
              <div className="flex flex-wrap gap-2">{cond.treatments?.map((t) => <span key={t} className="cd-tag">{t}</span>)}</div>
            </div>
          </div>
          {cond.functional_impact && (
            <div className="mb-4">
              <div className="cd-field-label">Functional Impact</div>
              <p style={{ fontSize: "13px", color: "rgba(205,213,224,0.7)", lineHeight: 1.6 }}>{cond.functional_impact}</p>
            </div>
          )}
          <div className="flex items-center gap-2 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
            <button className="cd-btn"><Merge size={13} /> Merge</button>
            <button className="cd-btn">Split Condition</button>
            <button className="cd-btn">View Evidence</button>
          </div>
        </div>
      )}
    </div>
  );
}
