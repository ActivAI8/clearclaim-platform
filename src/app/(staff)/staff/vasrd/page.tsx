"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VASRDBodySystem, VASRDSection } from "@/lib/types";
import {
  BookOpen,
  Search,
  ExternalLink,
  Pin,
  ChevronRight,
  ChevronDown,
  ListChecks,
  FileQuestion,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STYLES = `
  .vs-shell { display: flex; height: calc(100vh - 3.5rem); overflow: hidden; font-family: 'Barlow', sans-serif; color: #cdd5e0; }
  .vs-sidebar { width: 320px; border-right: 1px solid rgba(255,255,255,0.07); background: #0d1420; display: flex; flex-direction: column; flex-shrink: 0; }
  .vs-sidebar-header { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .vs-sidebar-title { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #cdd5e0; display: flex; align-items: center; gap: 8px; }
  .vs-sidebar-title svg { color: #d4a843; }
  .vs-sidebar-sub { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.35); margin-top: 4px; }
  .vs-search-wrap { position: relative; margin-top: 12px; }
  .vs-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: rgba(205,213,224,0.25); }
  .vs-search-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 8px 10px 8px 32px; font-size: 12px; color: #cdd5e0; outline: none; }
  .vs-search-input::placeholder { color: rgba(205,213,224,0.25); }
  .vs-search-input:focus { border-color: rgba(212,168,67,0.35); }
  .vs-tree { flex: 1; overflow-y: auto; padding: 8px; }
  .vs-sys-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 4px; text-align: left; transition: background 0.12s; cursor: pointer; background: transparent; border: none; color: inherit; }
  .vs-sys-btn:hover { background: rgba(255,255,255,0.04); }
  .vs-sys-btn.active { background: rgba(212,168,67,0.08); }
  .vs-sys-name { font-size: 13px; font-weight: 500; color: #cdd5e0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .vs-sys-ref { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.3); }
  .vs-sys-count { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 2px; color: rgba(205,213,224,0.35); }
  .vs-sec-list { margin-left: 24px; margin-top: 4px; }
  .vs-sec-btn { width: 100%; text-align: left; padding: 8px 12px; border-radius: 4px; transition: background 0.12s; cursor: pointer; background: transparent; border: none; color: inherit; margin-bottom: 2px; }
  .vs-sec-btn:hover { background: rgba(255,255,255,0.04); }
  .vs-sec-btn.active { background: rgba(212,168,67,0.12); border-left: 2px solid #d4a843; }
  .vs-sec-name { font-size: 12px; font-weight: 500; color: #cdd5e0; }
  .vs-sec-meta { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.3); margin-top: 2px; }

  .vs-detail { flex: 1; overflow-y: auto; background: #080c12; }
  .vs-detail-content { padding: 1.5rem; max-width: 720px; }
  .vs-detail-title { font-family: 'Bebas Neue', sans-serif; font-size: 28px; letter-spacing: 0.05em; color: #cdd5e0; line-height: 1.1; }
  .vs-detail-sub { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.4); margin-top: 4px; }
  .vs-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; font-size: 12px; color: rgba(205,213,224,0.6); cursor: pointer; transition: all 0.12s; text-decoration: none; }
  .vs-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .vs-card { background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 1rem 1.25rem; margin-bottom: 16px; position: relative; overflow: hidden; }
  .vs-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(212,168,67,0.1), transparent); pointer-events: none; }
  .vs-card-title { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd5e0; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .vs-card-title svg { color: rgba(205,213,224,0.35); }
  .vs-dc-badge { font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 10px; background: rgba(77,166,255,0.08); color: #4da6ff; border: 1px solid rgba(77,166,255,0.15); border-radius: 2px; }
  .vs-cat-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; margin-bottom: 8px; }
  .vs-cat-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 4px; flex-shrink: 0; }
  .vs-cat-dot.required { background: #f56565; }
  .vs-cat-dot.recommended { background: #f0c958; }
  .vs-cat-dot.optional { background: rgba(205,213,224,0.3); }
  .vs-cat-name { font-size: 13px; font-weight: 500; color: #cdd5e0; }
  .vs-cat-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; border-radius: 2px; letter-spacing: 0.06em; text-transform: uppercase; }
  .vs-cat-badge.required { background: rgba(245,101,101,0.1); color: #f56565; border: 1px solid rgba(245,101,101,0.2); }
  .vs-cat-badge.recommended { background: rgba(212,168,67,0.12); color: #f0c958; border: 1px solid rgba(212,168,67,0.2); }
  .vs-cat-badge.optional { background: rgba(255,255,255,0.06); color: rgba(205,213,224,0.5); border: 1px solid rgba(255,255,255,0.07); }
  .vs-cat-desc { font-size: 12px; color: rgba(205,213,224,0.5); margin-top: 2px; }
  .vs-q-row { display: flex; gap: 8px; font-size: 13px; color: rgba(205,213,224,0.7); margin-bottom: 6px; }
  .vs-q-num { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.3); flex-shrink: 0; }
  .vs-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center; padding: 2rem; }
  .vs-empty svg { color: rgba(205,213,224,0.08); margin-bottom: 16px; }
  .vs-empty-title { font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 600; letter-spacing: 0.06em; color: rgba(205,213,224,0.3); }
  .vs-empty-desc { font-size: 13px; color: rgba(205,213,224,0.25); margin-top: 8px; max-width: 400px; }
  .vs-spinner { display: flex; align-items: center; justify-content: center; height: 8rem; }
  .vs-spin { width: 24px; height: 24px; border: 3px solid rgba(212,168,67,0.2); border-top-color: #d4a843; border-radius: 50%; animation: vsspin 0.7s linear infinite; }
  @keyframes vsspin { to { transform: rotate(360deg); } }
`;

export default function VASRDExplorerPage() {
  const [bodySystems, setBodySystems] = useState<VASRDBodySystem[]>([]);
  const [sections, setSections] = useState<VASRDSection[]>([]);
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<VASRDSection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [bsRes, secRes] = await Promise.all([
        supabase.from("vasrd_body_systems").select("*").order("sort_order"),
        supabase.from("vasrd_sections").select("*").order("sort_order"),
      ]);
      setBodySystems((bsRes.data as VASRDBodySystem[]) || []);
      setSections((secRes.data as VASRDSection[]) || []);
      setLoading(false);
    }
    load();
  }, []);

  const filteredSystems = searchQuery
    ? bodySystems.filter((bs) =>
        bs.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sections.some((s) => s.body_system_id === bs.id && (s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.diagnostic_codes?.some((dc) => dc.includes(searchQuery))))
      )
    : bodySystems;

  const demoCategories = selectedSection
    ? [
        { name: "Diagnosis / Medical Records", required: "required" as const, description: "Formal medical diagnosis documenting the condition" },
        { name: "In-Service Occurrence", required: "required" as const, description: "Evidence of injury, event, or onset during military service" },
        { name: "Nexus / Medical Opinion", required: "recommended" as const, description: "Medical professional opinion linking condition to service" },
        { name: "Functional Impact Assessment", required: "recommended" as const, description: "Documentation of how condition affects daily activities and work" },
        { name: "Treatment Records", required: "recommended" as const, description: "Records of ongoing treatment and medications" },
        { name: "Buddy / Lay Statements", required: "optional" as const, description: "Statements from family, friends, or fellow service members" },
      ]
    : [];

  return (
    <div className="vs-shell">
      <style>{STYLES}</style>

      <div className="vs-sidebar">
        <div className="vs-sidebar-header">
          <div className="vs-sidebar-title"><BookOpen size={18} /> VASRD Explorer</div>
          <div className="vs-sidebar-sub">38 CFR Part 4 - Schedule for Rating Disabilities</div>
          <div className="vs-search-wrap">
            <Search size={12} className="vs-search-icon" />
            <input className="vs-search-input" placeholder="Search body systems, codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="vs-tree">
          {loading ? (
            <div className="vs-spinner"><div className="vs-spin" /></div>
          ) : (
            filteredSystems.map((bs) => {
              const sysSections = sections.filter((s) => s.body_system_id === bs.id);
              const isExpanded = expandedSystem === bs.id;
              return (
                <div key={bs.id}>
                  <button onClick={() => setExpandedSystem(isExpanded ? null : bs.id)} className={cn("vs-sys-btn", isExpanded && "active")}>
                    {isExpanded ? <ChevronDown size={14} style={{ color: "#d4a843", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "rgba(205,213,224,0.3)", flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="vs-sys-name">{bs.name}</div>
                      <div className="vs-sys-ref">{bs.cfr_reference}</div>
                    </div>
                    {sysSections.length > 0 && <span className="vs-sys-count">{sysSections.length}</span>}
                  </button>
                  {isExpanded && sysSections.length > 0 && (
                    <div className="vs-sec-list">
                      {sysSections.map((sec) => (
                        <button key={sec.id} onClick={() => setSelectedSection(sec)} className={cn("vs-sec-btn", selectedSection?.id === sec.id && "active")}>
                          <div className="vs-sec-name">{sec.title}</div>
                          <div className="vs-sec-meta">
                            {sec.section_number}
                            {sec.diagnostic_codes && sec.diagnostic_codes.length > 0 && (
                              <span> - DC: {sec.diagnostic_codes.slice(0, 3).join(", ")}{sec.diagnostic_codes.length > 3 ? "..." : ""}</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="vs-detail">
        {selectedSection ? (
          <div className="vs-detail-content">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="vs-detail-title">{selectedSection.title}</div>
                <div className="vs-detail-sub">Section {selectedSection.section_number}</div>
              </div>
              <div className="flex gap-2">
                <button className="vs-btn"><Pin size={13} /> Pin to Case</button>
                {selectedSection.cfr_url && (
                  <a href={selectedSection.cfr_url} target="_blank" rel="noopener noreferrer" className="vs-btn"><ExternalLink size={13} /> View CFR</a>
                )}
              </div>
            </div>

            {selectedSection.description && (
              <div className="vs-card">
                <p style={{ fontSize: "13px", color: "rgba(205,213,224,0.7)", lineHeight: 1.6 }}>{selectedSection.description}</p>
              </div>
            )}

            {selectedSection.diagnostic_codes && selectedSection.diagnostic_codes.length > 0 && (
              <div className="vs-card">
                <div className="vs-card-title"><Info size={14} /> Diagnostic Codes</div>
                <div className="flex flex-wrap gap-2">
                  {selectedSection.diagnostic_codes.map((dc) => <span key={dc} className="vs-dc-badge">DC {dc}</span>)}
                </div>
              </div>
            )}

            <div className="vs-card">
              <div className="vs-card-title"><ListChecks size={14} /> Evidence Categories</div>
              <p style={{ fontSize: "11px", color: "rgba(205,213,224,0.35)", marginBottom: "12px" }}>Categories of evidence to look for when building a case referencing this VASRD section.</p>
              {demoCategories.map((cat) => (
                <div key={cat.name} className="vs-cat-row">
                  <div className={cn("vs-cat-dot", cat.required)} />
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2">
                      <span className="vs-cat-name">{cat.name}</span>
                      <span className={cn("vs-cat-badge", cat.required)}>{cat.required}</span>
                    </div>
                    <p className="vs-cat-desc">{cat.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="vs-card">
              <div className="vs-card-title"><FileQuestion size={14} /> Intake Question Pack</div>
              <p style={{ fontSize: "11px", color: "rgba(205,213,224,0.35)", marginBottom: "12px" }}>Suggested questions to ask the veteran based on this VASRD section.</p>
              {[
                "When did you first notice symptoms of this condition?",
                "Did any specific event during service cause or worsen this condition?",
                "How does this condition affect your ability to work?",
                "Describe how this condition impacts your daily activities.",
                "How often do you experience flare-ups, and how long do they last?",
                "What treatments have you received for this condition?",
              ].map((q, i) => (
                <div key={i} className="vs-q-row"><span className="vs-q-num">{i + 1}.</span><span>{q}</span></div>
              ))}
              <button className="vs-btn" style={{ marginTop: "12px" }}>Add to Veteran Intake</button>
            </div>
          </div>
        ) : (
          <div className="vs-empty">
            <BookOpen size={56} />
            <div className="vs-empty-title">Select a VASRD Section</div>
            <p className="vs-empty-desc">Browse the 38 CFR Part 4 body systems on the left and select a section to view diagnostic codes, evidence categories, and suggested intake questions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
