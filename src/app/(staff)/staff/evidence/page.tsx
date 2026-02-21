"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Highlighter,
  BookmarkPlus,
  ExternalLink,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeColors: Record<string, string> = {
  diagnosis: "#a78bfa",
  measurement: "#4da6ff",
  symptom: "#fb923c",
  treatment: "#3ecf8e",
  fact: "#cdd5e0",
  date: "#22d3ee",
  medication: "#f472b6",
  other: "#cdd5e0",
};

const typeBg: Record<string, string> = {
  diagnosis: "rgba(167,139,250,0.12)",
  measurement: "rgba(77,166,255,0.12)",
  symptom: "rgba(251,146,60,0.12)",
  treatment: "rgba(62,207,142,0.12)",
  fact: "rgba(255,255,255,0.06)",
  date: "rgba(34,211,238,0.12)",
  medication: "rgba(244,114,182,0.12)",
  other: "rgba(255,255,255,0.06)",
};

interface CaseOption { id: string; case_number: string; veteran_name: string; }
interface DocItem { id: string; file_name: string; category: string; page_count: number; processing_status: string; storage_path?: string; ocr_text?: string; }
interface SnippetItem { id: string; document_id: string; page_number: number; snippet_text: string; snippet_type: string; confidence: number; }

const STYLES = `
  .ev-shell { display: flex; flex-direction: column; height: calc(100vh - 3.5rem); overflow: hidden; font-family: 'Barlow', sans-serif; color: #cdd5e0; }
  .ev-topbar { padding: 10px 16px; display: flex; align-items: center; gap: 12px; background: rgba(13,20,32,0.95); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .ev-topbar h1 { font-family: 'Barlow Condensed', sans-serif; font-size: 16px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #cdd5e0; }
  .ev-select { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; padding: 6px 10px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.6); outline: none; cursor: pointer; min-width: 260px; }
  .ev-select:focus { border-color: rgba(212,168,67,0.4); }
  .ev-select option { background: #0d1420; color: #cdd5e0; }
  .ev-body { display: flex; flex: 1; overflow: hidden; }
  .ev-sidebar { width: 256px; border-right: 1px solid rgba(255,255,255,0.07); background: #0d1420; display: flex; flex-direction: column; flex-shrink: 0; }
  .ev-sidebar-header { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.07); font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(205,213,224,0.6); }
  .ev-sidebar-list { flex: 1; overflow-y: auto; padding: 8px; }
  .ev-doc-btn { width: 100%; text-align: left; padding: 10px 12px; border-radius: 4px; transition: background 0.12s; cursor: pointer; background: transparent; border: none; color: inherit; }
  .ev-doc-btn:hover { background: rgba(255,255,255,0.04); }
  .ev-doc-btn.active { background: rgba(212,168,67,0.12); border-left: 2px solid #d4a843; }
  .ev-doc-name { font-size: 13px; font-weight: 500; color: #cdd5e0; display: flex; align-items: center; gap: 6px; }
  .ev-doc-meta { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.35); margin-top: 4px; margin-left: 22px; display: flex; align-items: center; gap: 8px; }
  .ev-doc-badge-done { font-size: 9px; padding: 1px 5px; background: rgba(62,207,142,0.12); color: #3ecf8e; border: 1px solid rgba(62,207,142,0.2); border-radius: 2px; }
  .ev-doc-badge-proc { font-size: 9px; padding: 1px 5px; background: rgba(212,168,67,0.12); color: #f0c958; border: 1px solid rgba(212,168,67,0.2); border-radius: 2px; }

  .ev-viewer { flex: 1; display: flex; flex-direction: column; background: #080c12; }
  .ev-toolbar { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: rgba(13,20,32,0.95); border-bottom: 1px solid rgba(255,255,255,0.07); }
  .ev-tool-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; color: rgba(205,213,224,0.5); cursor: pointer; transition: all 0.12s; }
  .ev-tool-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }
  .ev-page-nav { display: flex; align-items: center; gap: 4px; margin: 0 8px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(205,213,224,0.5); }
  .ev-text-btn { display: flex; align-items: center; gap: 5px; padding: 6px 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; font-size: 12px; color: rgba(205,213,224,0.5); cursor: pointer; transition: all 0.12s; }
  .ev-text-btn:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }

  .ev-content { flex: 1; overflow-y: auto; padding: 24px; display: flex; justify-content: center; }
  .ev-page { background: #111927; border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; max-width: 680px; width: 100%; padding: 2rem; min-height: 600px; }
  .ev-page-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.3); margin-bottom: 16px; }
  .ev-snippet { border-radius: 4px; padding: 12px; cursor: pointer; transition: all 0.12s; margin-bottom: 8px; border-left: 3px solid transparent; }
  .ev-snippet:hover { background: rgba(255,255,255,0.04); }
  .ev-snippet.active { background: rgba(212,168,67,0.08); border-left-color: #d4a843; }
  .ev-snippet-text { font-size: 13px; color: rgba(205,213,224,0.8); line-height: 1.6; }
  .ev-snippet-meta { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
  .ev-snippet-type { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; border-radius: 2px; text-transform: uppercase; letter-spacing: 0.08em; }
  .ev-snippet-conf { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: rgba(205,213,224,0.35); }

  .ev-snippets-panel { width: 320px; border-left: 1px solid rgba(255,255,255,0.07); background: #0d1420; display: flex; flex-direction: column; flex-shrink: 0; }
  .ev-snippets-header { padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.07); }
  .ev-snippets-title { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(205,213,224,0.6); margin-bottom: 8px; }
  .ev-search-wrap { position: relative; }
  .ev-search-icon { position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: rgba(205,213,224,0.25); }
  .ev-search-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 4px; padding: 6px 8px 6px 30px; font-size: 12px; color: #cdd5e0; outline: none; }
  .ev-search-input::placeholder { color: rgba(205,213,224,0.25); }
  .ev-search-input:focus { border-color: rgba(212,168,67,0.35); }
  .ev-snippets-list { flex: 1; overflow-y: auto; padding: 8px; }
  .ev-snippet-card { width: 100%; text-align: left; border-radius: 4px; padding: 10px; transition: background 0.12s; cursor: pointer; background: transparent; border: 1px solid transparent; color: inherit; margin-bottom: 6px; }
  .ev-snippet-card:hover { background: rgba(255,255,255,0.03); }
  .ev-snippet-card.active { background: rgba(212,168,67,0.08); border-color: rgba(212,168,67,0.2); }
  .ev-snippet-card-text { font-size: 12px; color: rgba(205,213,224,0.7); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .ev-snippet-card-actions { display: flex; gap: 4px; margin-top: 6px; }
  .ev-snippet-action { font-family: 'IBM Plex Mono', monospace; font-size: 9px; padding: 2px 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 2px; color: rgba(205,213,224,0.4); cursor: pointer; display: flex; align-items: center; gap: 3px; transition: all 0.12s; text-transform: uppercase; letter-spacing: 0.06em; }
  .ev-snippet-action:hover { background: rgba(255,255,255,0.08); color: #cdd5e0; }

  .ev-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem; color: rgba(205,213,224,0.25); gap: 8px; }
  .ev-empty-text { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
`;

export default function EvidenceViewerPage() {
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [snippets, setSnippets] = useState<SnippetItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSnippet, setSelectedSnippet] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadCases() {
      const { data } = await supabase.from("cases").select("id, case_number, veteran:veterans(first_name, last_name)").order("created_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts = (data || []).map((c: any) => ({ id: c.id, case_number: c.case_number, veteran_name: c.veteran ? `${c.veteran.first_name} ${c.veteran.last_name}` : "Unknown" }));
      setCases(opts);
      if (opts.length > 0) setSelectedCaseId(opts[0].id);
    }
    loadCases();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCaseId) return;
    async function loadDocs() {
      const [docRes, snippetRes] = await Promise.all([
        supabase.from("documents").select("id, file_name, category, page_count, processing_status, storage_path, ocr_text").eq("case_id", selectedCaseId).order("created_at"),
        supabase.from("evidence_snippets").select("*").eq("case_id", selectedCaseId).order("page_number"),
      ]);
      const docs = (docRes.data || []) as DocItem[];
      setDocuments(docs);
      setSnippets((snippetRes.data || []) as SnippetItem[]);
      if (docs.length > 0) { setSelectedDoc(docs[0]); setCurrentPage(1); }
      else setSelectedDoc(null);
    }
    loadDocs();
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSnippets = snippets.filter((s) => {
    if (selectedDoc && s.document_id !== selectedDoc.id) return false;
    if (searchQuery) return s.snippet_text.toLowerCase().includes(searchQuery.toLowerCase());
    return true;
  });

  return (
    <div className="ev-shell">
      <style>{STYLES}</style>

      <div className="ev-topbar">
        <h1>Evidence Viewer</h1>
        <select className="ev-select" value={selectedCaseId} onChange={(e) => setSelectedCaseId(e.target.value)}>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>{c.case_number} - {c.veteran_name}</option>
          ))}
        </select>
      </div>

      <div className="ev-body">
        {/* Document list */}
        <div className="ev-sidebar">
          <div className="ev-sidebar-header">Documents ({documents.length})</div>
          <div className="ev-sidebar-list">
            {documents.length === 0 ? (
              <div className="ev-empty"><span className="ev-empty-text">No documents</span></div>
            ) : documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => { setSelectedDoc(doc); setCurrentPage(1); }}
                className={cn("ev-doc-btn", selectedDoc?.id === doc.id && "active")}
              >
                <div className="ev-doc-name">
                  <FileText size={14} style={{ color: "rgba(205,213,224,0.35)", flexShrink: 0 }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.file_name}</span>
                </div>
                <div className="ev-doc-meta">
                  <span>{doc.page_count} pages</span>
                  <span className={doc.processing_status === "complete" ? "ev-doc-badge-done" : "ev-doc-badge-proc"}>
                    {doc.processing_status === "complete" ? "Processed" : "Processing..."}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main viewer */}
        <div className="ev-viewer">
          <div className="ev-toolbar">
            <button className="ev-tool-btn"><ZoomOut size={14} /></button>
            <button className="ev-tool-btn"><ZoomIn size={14} /></button>
            {selectedDoc && (
              <div className="ev-page-nav">
                <button className="ev-tool-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}><ChevronLeft size={14} /></button>
                <span>Page {currentPage} / {selectedDoc.page_count}</span>
                <button className="ev-tool-btn" onClick={() => setCurrentPage(Math.min(selectedDoc.page_count, currentPage + 1))}><ChevronRight size={14} /></button>
              </div>
            )}
            <div style={{ flex: 1 }} />
            {selectedDoc?.storage_path && (
              <button className="ev-text-btn" onClick={async () => {
                const { data } = await supabase.storage.from("veteran-documents").createSignedUrl(selectedDoc.storage_path!, 300);
                if (data?.signedUrl) window.open(data.signedUrl, "_blank");
              }}>
                <Eye size={13} /> View Original
              </button>
            )}
            <button className="ev-text-btn"><Highlighter size={13} /> Highlights</button>
            <button className="ev-tool-btn"><Maximize2 size={14} /></button>
          </div>

          <div className="ev-content">
            <div className="ev-page">
              {selectedDoc ? (
                <>
                  <div className="ev-page-label">{selectedDoc.file_name} - Page {currentPage}</div>
                  {selectedDoc.ocr_text ? (
                    <div style={{ fontSize: "13px", color: "rgba(205,213,224,0.7)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{selectedDoc.ocr_text}</div>
                  ) : (
                    <div>
                      <p style={{ fontSize: "11px", color: "rgba(205,213,224,0.2)", marginBottom: "12px" }}>[ ... preceding text ... ]</p>
                      {filteredSnippets.filter((s) => s.page_number === currentPage || s.page_number === currentPage + 1).map((snippet) => (
                        <div
                          key={snippet.id}
                          className={cn("ev-snippet", selectedSnippet === snippet.id && "active")}
                          onClick={() => setSelectedSnippet(snippet.id)}
                        >
                          <p className="ev-snippet-text">{snippet.snippet_text}</p>
                          <div className="ev-snippet-meta">
                            <span className="ev-snippet-type" style={{ background: typeBg[snippet.snippet_type] || typeBg.other, color: typeColors[snippet.snippet_type] || typeColors.other }}>{snippet.snippet_type}</span>
                            <span className="ev-snippet-conf">Confidence: {Math.round(snippet.confidence * 100)}%</span>
                            <span className="ev-snippet-conf">Page {snippet.page_number}</span>
                          </div>
                        </div>
                      ))}
                      {filteredSnippets.filter((s) => s.page_number === currentPage || s.page_number === currentPage + 1).length === 0 && (
                        <div className="ev-empty" style={{ padding: "4rem 2rem" }}>
                          <FileText size={32} style={{ opacity: 0.15 }} />
                          <span className="ev-empty-text">No highlighted snippets on this page</span>
                        </div>
                      )}
                      <p style={{ fontSize: "11px", color: "rgba(205,213,224,0.2)", marginTop: "12px" }}>[ ... following text ... ]</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="ev-empty" style={{ padding: "4rem 2rem" }}>
                  <FileText size={32} style={{ opacity: 0.15 }} />
                  <span className="ev-empty-text">Select a document to view</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Snippets panel */}
        <div className="ev-snippets-panel">
          <div className="ev-snippets-header">
            <div className="ev-snippets-title">Evidence Snippets ({filteredSnippets.length})</div>
            <div className="ev-search-wrap">
              <Search size={12} className="ev-search-icon" />
              <input className="ev-search-input" placeholder="Search snippets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="ev-snippets-list">
            {filteredSnippets.length === 0 ? (
              <div className="ev-empty" style={{ padding: "2rem" }}><span className="ev-empty-text">No snippets extracted</span></div>
            ) : filteredSnippets.map((snippet) => (
              <button
                key={snippet.id}
                onClick={() => { setSelectedSnippet(snippet.id); setCurrentPage(snippet.page_number); }}
                className={cn("ev-snippet-card", selectedSnippet === snippet.id && "active")}
              >
                <div className="ev-snippet-meta" style={{ marginTop: 0, marginBottom: 6 }}>
                  <span className="ev-snippet-type" style={{ background: typeBg[snippet.snippet_type] || typeBg.other, color: typeColors[snippet.snippet_type] || typeColors.other }}>{snippet.snippet_type}</span>
                  <span className="ev-snippet-conf">p.{snippet.page_number}</span>
                  <span className="ev-snippet-conf" style={{ marginLeft: "auto" }}>{Math.round(snippet.confidence * 100)}%</span>
                </div>
                <p className="ev-snippet-card-text">{snippet.snippet_text}</p>
                <div className="ev-snippet-card-actions">
                  <span className="ev-snippet-action" onClick={(e) => e.stopPropagation()}><BookmarkPlus size={10} /> Pin</span>
                  <span className="ev-snippet-action" onClick={(e) => e.stopPropagation()}><ExternalLink size={10} /> View</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
