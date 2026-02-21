"use client";

import { useState, useRef, useEffect } from "react";
import {
  Shield, Send, Loader2, CheckCircle2, ChevronRight,
  User, Calendar, Heart, Briefcase, Upload, Sparkles,
  Brain, AlertTriangle, Zap, Copy, ArrowRight,
} from "lucide-react";

interface ExtractedData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  branch?: string;
  serviceStart?: string;
  serviceEnd?: string;
  dischargeStatus?: string;
  conditions?: Array<{ name: string; vasrdCode?: string; description?: string }>;
  suggestedConditions?: Array<{ name: string; vasrdCode?: string; reason?: string }>;
  functionalImpact?: {
    work?: string;
    daily?: string;
    flareFrequency?: string;
    flareDuration?: string;
  };
  intakeProgress?: number;
}

const STEPS = [
  { key: "personal", label: "Personal Info", icon: User },
  { key: "service", label: "Service", icon: Calendar },
  { key: "conditions", label: "Conditions", icon: Heart },
  { key: "impact", label: "Impact", icon: Briefcase },
  { key: "documents", label: "Documents", icon: Upload },
  { key: "review", label: "Review", icon: CheckCircle2 },
];

export default function VeteranIntakePage() {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData>({});
  const [started, setStarted] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const progress = extracted.intakeProgress || 0;
  const currentStepIdx = progress < 15 ? 0 : progress < 30 ? 1 : progress < 50 ? 2 : progress < 70 ? 3 : progress < 85 ? 4 : 5;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function startIntake() {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/intake-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Hi, I'd like to start my VA disability claim intake.",
          history: [],
          extractedData: null,
        }),
      });
      const data = await res.json();
      setMessages([{ role: "assistant", content: data.response }]);
      if (data.extracted) setExtracted(data.extracted);
    } catch {
      setMessages([{ role: "assistant", content: "Let's get started. What's your name?" }]);
    }
    setLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/intake-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg,
          history: newMessages.slice(-12),
          extractedData: extracted,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      if (data.extracted) {
        setExtracted((prev) => ({ ...prev, ...data.extracted }));
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "I had trouble processing that. Could you try again?" }]);
    }
    setLoading(false);
  }

  function handleQuickReply(text: string) {
    setInput(text);
  }

  return (
    <div className="intake-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        .intake-shell {
          min-height: 100svh;
          background: #080c12;
          color: #cdd5e0;
          font-family: 'Barlow', sans-serif;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }
        .intake-shell::before {
          content: '';
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(212,168,67,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,168,67,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none; z-index: 0;
        }
        .intake-shell::after {
          content: '';
          position: fixed; inset: 0;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,168,67,0.05) 0%, transparent 70%);
          pointer-events: none; z-index: 0;
        }

        .intake-header {
          position: sticky; top: 0; z-index: 50;
          background: rgba(8,12,18,0.92);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .intake-header-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .intake-progress-bar {
          position: sticky; top: 56px; z-index: 40;
          background: rgba(8,12,18,0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          padding: 12px 0;
        }
        .intake-progress-inner {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        .intake-steps {
          display: flex;
          gap: 3px;
          margin-bottom: 8px;
        }
        .intake-step {
          flex: 1; height: 3px;
          background: rgba(255,255,255,0.06);
          transition: background 0.5s;
          position: relative;
        }
        .intake-step.done { background: #d4a843; }
        .intake-step.done::after {
          content: ''; position: absolute; inset: -1px;
          background: #d4a843; filter: blur(3px); opacity: 0.4;
        }
        .intake-step-labels {
          display: flex; justify-content: space-between;
        }
        .intake-step-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px; letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.2);
          transition: color 0.3s;
        }
        .intake-step-label.active { color: #d4a843; }

        .intake-content {
          flex: 1;
          max-width: 1100px;
          margin: 0 auto;
          width: 100%;
          padding: 0 1.5rem;
          display: flex;
          gap: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .intake-chat-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: calc(100svh - 140px);
        }

        .intake-sidebar {
          width: 320px;
          flex-shrink: 0;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .intake-card {
          background: #111927;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .intake-card::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent);
          pointer-events: none;
        }
        .intake-card-head {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.12);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #cdd5e0;
        }
        .intake-card-body { padding: 14px 16px; }

        .intake-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }

        .intake-bubble {
          max-width: 80%;
          padding: 12px 18px;
          font-size: 14px;
          line-height: 1.65;
        }
        .intake-bubble.user {
          background: linear-gradient(135deg, #d4a843, #f0c958);
          color: #080c12;
          margin-left: auto;
          border-radius: 8px 8px 2px 8px;
          font-weight: 500;
        }
        .intake-bubble.assistant {
          background: #162032;
          color: #cdd5e0;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 2px 8px 8px 8px;
          border-left: 2px solid #d4a843;
        }

        .intake-input-row {
          padding: 1rem 0;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          gap: 10px;
        }
        .intake-input {
          flex: 1;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 4px;
          padding: 10px 14px;
          font-size: 14px;
          color: #cdd5e0;
          outline: none;
          font-family: 'Barlow', sans-serif;
          transition: border-color 0.15s;
        }
        .intake-input::placeholder { color: rgba(255,255,255,0.2); }
        .intake-input:focus { border-color: rgba(212,168,67,0.4); }

        .intake-btn-gold {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 4px; border: none;
          background: linear-gradient(135deg, #d4a843, #f0c958);
          color: #080c12;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s;
        }
        .intake-btn-gold:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 4px 20px rgba(212,168,67,0.4); transform: translateY(-1px); }
        .intake-btn-gold:disabled { opacity: 0.4; cursor: not-allowed; }

        .intake-btn-ghost {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 3px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.15s;
        }
        .intake-btn-ghost:hover { background: rgba(212,168,67,0.08); border-color: rgba(212,168,67,0.3); color: #f0c958; }

        .intake-chip {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 3px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px; font-weight: 600; letter-spacing: 0.06em;
        }
        .intake-chip-gold { background: rgba(212,168,67,0.12); color: #f0c958; border: 1px solid rgba(212,168,67,0.25); }
        .intake-chip-green { background: rgba(62,207,142,0.1); color: #3ecf8e; border: 1px solid rgba(62,207,142,0.2); }
        .intake-chip-blue { background: rgba(77,166,255,0.1); color: #4da6ff; border: 1px solid rgba(77,166,255,0.2); }
        .intake-chip-gray { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); border: 1px solid rgba(255,255,255,0.07); }

        .intake-condition-card {
          padding: 10px 12px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          transition: all 0.15s;
        }
        .intake-condition-card:hover { border-color: rgba(212,168,67,0.2); }

        .intake-quick-replies {
          display: flex; gap: 8px; flex-wrap: wrap;
          padding: 8px 0;
        }

        .intake-hero {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 24px;
          padding: 3rem;
        }

        .intake-mono { font-family: 'IBM Plex Mono', monospace; }
        .intake-display { font-family: 'Bebas Neue', sans-serif; letter-spacing: 0.04em; }

        .intake-summary-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(0,0,0,0.8);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          backdrop-filter: blur(6px);
        }
        .intake-summary-modal {
          background: #0d1420;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 8px;
          width: 100%; max-width: 640px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 30px 100px rgba(0,0,0,0.7);
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .intake-sidebar { display: none; }
          .intake-content { padding: 0 1rem; }
        }
      `}</style>

      {/* Header */}
      <header className="intake-header">
        <div className="intake-header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 6, background: "linear-gradient(135deg, #d4a843, #f0c958)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 18px rgba(212,168,67,0.3)" }}>
              <Shield size={17} color="#080c12" strokeWidth={2.5} />
            </div>
            <div>
              <div className="intake-display" style={{ fontSize: 19, color: "#cdd5e0" }}>ClearClaim</div>
              <div className="intake-mono" style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "#d4a843", opacity: 0.7 }}>AI-Powered Intake</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#3ecf8e", boxShadow: "0 0 8px #3ecf8e" }} />
              <span className="intake-mono" style={{ fontSize: 10, color: "#3ecf8e", letterSpacing: "0.06em" }}>SECURE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {started && (
        <div className="intake-progress-bar">
          <div className="intake-progress-inner">
            <div className="intake-steps">
              {STEPS.map((_, i) => (
                <div key={i} className={`intake-step${i <= currentStepIdx ? " done" : ""}`} />
              ))}
            </div>
            <div className="intake-step-labels">
              {STEPS.map((step, i) => (
                <span key={step.key} className={`intake-step-label${i <= currentStepIdx ? " active" : ""}`}>
                  {step.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="intake-content">
        {!started ? (
          /* Hero / Start screen */
          <div className="intake-hero">
            <div style={{ width: 80, height: 80, borderRadius: 12, background: "linear-gradient(135deg, rgba(212,168,67,0.15), rgba(240,201,88,0.08))", border: "1px solid rgba(212,168,67,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Brain size={36} color="#f0c958" />
            </div>
            <div>
              <h1 className="intake-display" style={{ fontSize: 42, color: "#cdd5e0", margin: 0 }}>AI-POWERED CLAIM INTAKE</h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", maxWidth: 500, margin: "8px auto 0", lineHeight: 1.6 }}>
                Have a conversation with our AI assistant. It will guide you through the intake process, identify your conditions, and suggest VASRD codes — all in a natural conversation.
              </p>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
              {[
                { icon: Sparkles, label: "AI auto-suggests conditions" },
                { icon: Zap, label: "VASRD codes pre-filled" },
                { icon: Brain, label: "Smart follow-up questions" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <Icon size={14} color="#d4a843" />
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{label}</span>
                </div>
              ))}
            </div>

            <button className="intake-btn-gold" style={{ padding: "14px 36px", fontSize: 16 }} onClick={startIntake}>
              <Brain size={18} /> Begin Intake Interview
            </button>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", maxWidth: 400 }}>
              Your information is encrypted and only shared with your assigned VSO caseworker.
            </p>
          </div>
        ) : (
          <>
            {/* Chat column */}
            <div className="intake-chat-col">
              <div className="intake-messages">
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                    <div className={`intake-bubble ${msg.role}`}>
                      {msg.role === "assistant" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                          <Brain size={11} color="#d4a843" />
                          <span className="intake-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#d4a843" }}>
                            Intake AI
                          </span>
                        </div>
                      )}
                      <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex" }}>
                    <div className="intake-bubble assistant" style={{ padding: "14px 18px", display: "flex", gap: 4 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.3)", animation: `pulse-dot 1.2s ease ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Quick replies */}
              {messages.length > 0 && messages.length < 4 && !loading && (
                <div className="intake-quick-replies">
                  {["Army", "Navy", "Air Force", "Marine Corps"].map((b) => (
                    <button key={b} className="intake-btn-ghost" onClick={() => handleQuickReply(b)}>{b}</button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSend} className="intake-input-row">
                <input
                  className="intake-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your response..."
                  disabled={loading}
                  autoFocus
                />
                <button type="submit" className="intake-btn-gold" disabled={loading || !input.trim()} style={{ padding: "10px 16px" }}>
                  {loading ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
                </button>
              </form>
            </div>

            {/* Sidebar - live extracted data */}
            <aside className="intake-sidebar">
              {/* Progress card */}
              <div className="intake-card">
                <div className="intake-card-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Intake Progress</span>
                  <span className="intake-chip intake-chip-gold">{progress}%</span>
                </div>
                <div className="intake-card-body">
                  <div style={{ height: 4, borderRadius: 0, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress}%`, background: "linear-gradient(90deg, #d4a843, #f0c958)", transition: "width 0.8s ease" }} />
                  </div>
                </div>
              </div>

              {/* Personal info */}
              {(extracted.firstName || extracted.branch) && (
                <div className="intake-card">
                  <div className="intake-card-head">
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={12} color="#d4a843" /> Veteran Info
                    </span>
                  </div>
                  <div className="intake-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extracted.firstName && (
                      <div>
                        <div className="intake-mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>Name</div>
                        <div style={{ fontSize: 13, color: "#e8eaf0" }}>{extracted.firstName} {extracted.lastName || ""}</div>
                      </div>
                    )}
                    {extracted.branch && (
                      <div>
                        <div className="intake-mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>Branch</div>
                        <div style={{ fontSize: 13, color: "#e8eaf0" }}>{extracted.branch}</div>
                      </div>
                    )}
                    {extracted.serviceStart && (
                      <div>
                        <div className="intake-mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>Service Period</div>
                        <div style={{ fontSize: 13, color: "#e8eaf0" }}>{extracted.serviceStart} — {extracted.serviceEnd || "present"}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Identified conditions */}
              {extracted.conditions && extracted.conditions.length > 0 && (
                <div className="intake-card">
                  <div className="intake-card-head" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Heart size={12} color="#f56565" /> Conditions Identified
                    </span>
                    <span className="intake-chip intake-chip-green">{extracted.conditions.length}</span>
                  </div>
                  <div className="intake-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extracted.conditions.map((c, i) => (
                      <div key={i} className="intake-condition-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#e8eaf0" }}>{c.name}</span>
                          {c.vasrdCode && (
                            <span className="intake-chip intake-chip-blue">{c.vasrdCode}</span>
                          )}
                        </div>
                        {c.description && (
                          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", lineHeight: 1.5, margin: 0 }}>{c.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested conditions */}
              {extracted.suggestedConditions && extracted.suggestedConditions.length > 0 && (
                <div className="intake-card" style={{ borderColor: "rgba(212,168,67,0.2)" }}>
                  <div className="intake-card-head" style={{ display: "flex", alignItems: "center", gap: 6, color: "#f0c958" }}>
                    <Sparkles size={12} /> AI-Suggested Conditions
                  </div>
                  <div className="intake-card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extracted.suggestedConditions.map((c, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                        <ArrowRight size={12} color="#d4a843" style={{ flexShrink: 0, marginTop: 3 }} />
                        <div>
                          <div style={{ fontSize: 13, color: "#e8eaf0", fontWeight: 500 }}>
                            {c.name}
                            {c.vasrdCode && <span className="intake-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 8 }}>{c.vasrdCode}</span>}
                          </div>
                          {c.reason && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{c.reason}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Review button */}
              {progress >= 70 && (
                <button
                  className="intake-btn-gold"
                  style={{ width: "100%", justifyContent: "center", padding: "12px 18px" }}
                  onClick={() => setShowSummary(true)}
                >
                  <CheckCircle2 size={15} /> Review Intake Summary
                </button>
              )}
            </aside>
          </>
        )}
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="intake-summary-overlay" onClick={(e) => e.target === e.currentTarget && setShowSummary(false)}>
          <div className="intake-summary-modal">
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.2)" }}>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>Intake Summary</div>
                <div className="intake-mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{progress}% COMPLETE</div>
              </div>
              <button className="intake-btn-ghost" onClick={() => { navigator.clipboard.writeText(JSON.stringify(extracted, null, 2)); }}>
                <Copy size={12} /> Copy Data
              </button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Personal */}
              <div>
                <div className="intake-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4a843", opacity: 0.65, marginBottom: 8 }}>Personal Information</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    ["Name", `${extracted.firstName || ""} ${extracted.lastName || ""}`.trim() || "Not provided"],
                    ["Branch", extracted.branch || "Not provided"],
                    ["Service", extracted.serviceStart ? `${extracted.serviceStart} - ${extracted.serviceEnd || "present"}` : "Not provided"],
                    ["Discharge", extracted.dischargeStatus || "Not provided"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="intake-mono" style={{ fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 13, color: "#e8eaf0" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conditions */}
              {extracted.conditions && extracted.conditions.length > 0 && (
                <div>
                  <div className="intake-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4a843", opacity: 0.65, marginBottom: 8 }}>
                    Conditions Identified ({extracted.conditions.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extracted.conditions.map((c, i) => (
                      <div key={i} className="intake-condition-card">
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#e8eaf0" }}>{c.name}</span>
                          {c.vasrdCode && <span className="intake-chip intake-chip-blue">{c.vasrdCode}</span>}
                        </div>
                        {c.description && <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested */}
              {extracted.suggestedConditions && extracted.suggestedConditions.length > 0 && (
                <div style={{ background: "rgba(212,168,67,0.04)", borderRadius: 6, padding: 14, border: "1px solid rgba(212,168,67,0.15)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <Sparkles size={13} color="#f0c958" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#f0c958" }}>AI also suggests these conditions</span>
                  </div>
                  {extracted.suggestedConditions.map((c, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
                      <ChevronRight size={12} color="#d4a843" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        <strong style={{ color: "#e8eaf0" }}>{c.name}</strong>
                        {c.vasrdCode && <span className="intake-mono" style={{ marginLeft: 6, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{c.vasrdCode}</span>}
                        {c.reason && <span style={{ display: "block", fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{c.reason}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Impact */}
              {extracted.functionalImpact && (extracted.functionalImpact.work || extracted.functionalImpact.daily) && (
                <div>
                  <div className="intake-mono" style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "#d4a843", opacity: 0.65, marginBottom: 8 }}>Functional Impact</div>
                  {extracted.functionalImpact.work && (
                    <div style={{ marginBottom: 8 }}>
                      <div className="intake-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>WORK</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{extracted.functionalImpact.work}</div>
                    </div>
                  )}
                  {extracted.functionalImpact.daily && (
                    <div>
                      <div className="intake-mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginBottom: 2 }}>DAILY LIFE</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{extracted.functionalImpact.daily}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Warning */}
              {progress < 85 && (
                <div style={{ display: "flex", gap: 10, padding: 12, borderRadius: 4, background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.15)" }}>
                  <AlertTriangle size={14} color="#f0c958" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                    Your intake is {progress}% complete. Continue the conversation to fill in missing details for a stronger claim.
                  </div>
                </div>
              )}
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 10, justifyContent: "flex-end", background: "rgba(0,0,0,0.2)" }}>
              <button className="intake-btn-ghost" onClick={() => setShowSummary(false)}>Continue Interview</button>
              <button className="intake-btn-gold" onClick={() => setShowSummary(false)}>
                <CheckCircle2 size={14} /> Submit Intake
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
