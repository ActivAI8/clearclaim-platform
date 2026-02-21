"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, ArrowRight, User, Briefcase, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import FullScreenLoader from "@/components/FullScreenLoader";

type LoginMode = "select" | "staff" | "veteran";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [mode, setMode] = useState<LoginMode>("select");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirect = searchParams.get("redirect");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const role = data.user.user_metadata?.role;
      if (mode === "veteran" && role !== "veteran") {
        toast.error("This account is not a veteran account. Use Staff Login.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (mode === "staff" && role === "veteran") {
        toast.error("This is a veteran account. Use Veteran Login.");
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (role === "veteran") {
        router.push("/veteran/portal");
      } else {
        router.push(redirect || "/staff");
      }
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoLogin(type: "staff" | "veteran") {
    if (type === "staff") {
      setMode("staff");
      setEmail("caseworker@clearclaim.demo");
      setPassword("demo1234");
    } else {
      setMode("veteran");
      setEmail("maria.garcia@veteran.demo");
      setPassword("demo1234");
    }
  }

  const stats = [
    { label: "Intake Time", value: "80%", unit: "Faster" },
    { label: "Citation", value: "PG.", unit: "Level" },
    { label: "Multi-Site", value: "✓", unit: "Ready" },
    { label: "VASRD Ref", value: "AI", unit: "Built-In" },
  ];

    return (
      <>
        <FullScreenLoader
          isLoading={loading}
          brandName="ClearClaim"
          tagline="Authenticating access"
        />
        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        :root {
          --obsidian: #080c12;
          --surface: #0d1520;
          --surface-2: #111a27;
          --surface-3: #16202f;
          --gold: #d4a843;
          --gold-dim: #a07c2a;
          --gold-glow: rgba(212,168,67,0.15);
          --amber: #f59e0b;
          --steel: #7a9ab8;
          --steel-dim: #4a6a88;
          --text: #e8edf3;
          --text-dim: #8a9bb0;
          --text-muted: #4a5a6a;
          --border: rgba(212,168,67,0.12);
          --border-subtle: rgba(120,160,200,0.1);
          --green: #22c55e;
          --blue: #3b82f6;
          --font-display: 'Bebas Neue', sans-serif;
          --font-ui: 'Barlow Condensed', sans-serif;
          --font-body: 'Barlow', sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          display: flex;
          min-height: 100vh;
          background-color: var(--obsidian);
          font-family: var(--font-body);
          position: relative;
          overflow: hidden;
        }

        .lp-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background-image: radial-gradient(circle, rgba(120,160,210,0.07) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 0;
        }

        .lp-root::after {
          content: '';
          position: fixed;
          top: -200px;
          left: -100px;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 65%);
          pointer-events: none;
          z-index: 0;
        }

        .lp-left {
          display: none;
          position: relative;
          z-index: 1;
          flex-direction: column;
          justify-content: center;
          padding: 64px;
          flex: 1;
        }

        @media (min-width: 1024px) { .lp-left { display: flex; } }

        .lp-wordmark {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 56px;
        }

        .lp-shield {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
          clip-path: polygon(50% 0%, 100% 20%, 100% 60%, 50% 100%, 0% 60%, 0% 20%);
        }

        .lp-brand-name {
          font-family: var(--font-display);
          font-size: 28px;
          letter-spacing: 0.06em;
          color: var(--text);
        }

        .lp-classified-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.2em;
          color: var(--gold);
          border: 1px solid var(--gold);
          padding: 3px 8px;
          margin-bottom: 24px;
          text-transform: uppercase;
        }

        .lp-classified-tag::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: lp-pulse 2s ease-in-out infinite;
        }

        @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

        .lp-headline {
          font-family: var(--font-display);
          font-size: clamp(40px, 4vw, 58px);
          line-height: 1;
          letter-spacing: 0.02em;
          color: var(--text);
          margin-bottom: 20px;
        }

        .lp-headline span { color: var(--gold); }

        .lp-subhead {
          font-family: var(--font-body);
          font-weight: 300;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-dim);
          max-width: 420px;
          margin-bottom: 52px;
        }

        .lp-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          max-width: 420px;
        }

        .lp-stat {
          background: var(--surface);
          padding: 20px 22px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }

        .lp-stat::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .lp-stat:hover { background: var(--surface-2); }
        .lp-stat:hover::after { opacity: 1; }

        .lp-stat-value {
          font-family: var(--font-display);
          font-size: 34px;
          letter-spacing: 0.04em;
          color: var(--gold);
          line-height: 1;
        }

        .lp-stat-unit {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--text);
          text-transform: uppercase;
          margin-top: 2px;
        }

        .lp-stat-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 4px;
        }

        .lp-divider {
          display: none;
          width: 1px;
          background: linear-gradient(180deg, transparent 0%, var(--gold-dim) 30%, var(--gold-dim) 70%, transparent 100%);
          opacity: 0.3;
          align-self: stretch;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) { .lp-divider { display: block; } }

        .lp-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          width: 100%;
          position: relative;
          z-index: 1;
        }

        @media (min-width: 1024px) {
          .lp-right { width: 480px; flex-shrink: 0; padding: 48px; }
        }

        .lp-card {
          width: 100%;
          max-width: 400px;
          background: var(--surface);
          border: 1px solid var(--border);
          position: relative;
          overflow: hidden;
        }

        .lp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold) 0%, var(--gold-dim) 60%, transparent 100%);
        }

        .lp-card-inner { padding: 32px; }

        .lp-mobile-mark {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 28px;
        }

        @media (min-width: 1024px) { .lp-mobile-mark { display: none; } }

        .lp-mobile-shield {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          clip-path: polygon(50% 0%, 100% 20%, 100% 60%, 50% 100%, 0% 60%, 0% 20%);
        }

        .lp-mobile-name {
          font-family: var(--font-display);
          font-size: 22px;
          letter-spacing: 0.06em;
          color: var(--text);
        }

        .lp-card-header { margin-bottom: 28px; }

        .lp-card-title {
          font-family: var(--font-display);
          font-size: 30px;
          letter-spacing: 0.05em;
          color: var(--text);
        }

        .lp-card-sub {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 4px;
        }

        .lp-mode-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 18px;
          border: 1px solid var(--border-subtle);
          background: var(--surface-2);
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          position: relative;
          overflow: hidden;
        }

        .lp-mode-btn::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--gold);
          transform: scaleY(0);
          transition: transform 0.15s;
        }

        .lp-mode-btn:hover { background: var(--surface-3); border-color: var(--border); }
        .lp-mode-btn:hover::before { transform: scaleY(1); }

        .lp-mode-icon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-3);
          border: 1px solid var(--border-subtle);
          flex-shrink: 0;
          transition: all 0.15s;
        }

        .lp-mode-btn:hover .lp-mode-icon { border-color: var(--gold); background: var(--gold-glow); }
        .lp-mode-icon svg { color: var(--steel); transition: color 0.15s; }
        .lp-mode-btn:hover .lp-mode-icon svg { color: var(--gold); }

        .lp-mode-label {
          font-family: var(--font-ui);
          font-size: 14px; font-weight: 600;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
        }

        .lp-mode-desc { font-family: var(--font-body); font-size: 12px; color: var(--text-muted); margin-top: 1px; }

        .lp-mode-arrow { margin-left: auto; color: var(--text-muted); flex-shrink: 0; transition: all 0.15s; }
        .lp-mode-btn:hover .lp-mode-arrow { color: var(--gold); transform: translateX(2px); }

        .lp-sep { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .lp-sep-line { flex: 1; height: 1px; background: var(--border-subtle); }
        .lp-sep-label { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: var(--text-muted); text-transform: uppercase; }

        .lp-demo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

        .lp-demo-btn {
          padding: 9px 12px;
          border: 1px solid var(--border-subtle);
          background: transparent;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.15s;
        }

        .lp-demo-btn:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-glow); }
        .lp-demo-hint { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; color: var(--text-muted); text-align: center; margin-top: 8px; text-transform: uppercase; }

        .lp-back-btn {
          display: flex; align-items: center; gap: 4px;
          background: none; border: none; cursor: pointer;
          font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.1em;
          color: var(--text-muted); text-transform: uppercase; padding: 0;
          margin-bottom: 24px; transition: color 0.15s;
        }

        .lp-back-btn:hover { color: var(--gold); }

        .lp-form-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }

        .lp-form-icon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background: var(--surface-3);
          border: 1px solid var(--border);
        }

        .lp-form-icon svg { color: var(--gold); }

        .lp-form-title { font-family: var(--font-display); font-size: 24px; letter-spacing: 0.05em; color: var(--text); }
        .lp-form-subtitle { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.12em; color: var(--text-muted); text-transform: uppercase; }

        .lp-field { margin-bottom: 16px; }

        .lp-label { display: block; font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.2em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; }

        .lp-input {
          width: 100%; padding: 11px 14px;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          color: var(--text);
          font-family: var(--font-mono);
          font-size: 13px; outline: none;
          transition: border-color 0.15s;
        }

        .lp-input::placeholder { color: var(--text-muted); font-size: 12px; }
        .lp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 1px var(--gold); }

        .lp-submit {
          width: 100%; padding: 13px 20px;
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
          border: none; cursor: pointer;
          font-family: var(--font-display);
          font-size: 18px; letter-spacing: 0.1em;
          color: var(--obsidian); text-transform: uppercase;
          transition: all 0.15s; position: relative; overflow: hidden; margin-top: 4px;
        }

        .lp-submit:hover:not(:disabled) { filter: brightness(1.08); }
        .lp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .lp-creds {
          margin-top: 16px; padding: 14px;
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-left: 3px solid var(--gold-dim);
        }

        .lp-creds-title { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.18em; color: var(--gold); text-transform: uppercase; margin-bottom: 10px; }
        .lp-creds-row { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 5px; }
        .lp-creds-email { font-family: var(--font-mono); font-size: 10px; color: var(--text-dim); }
        .lp-creds-role { font-family: var(--font-ui); font-size: 10px; font-weight: 500; letter-spacing: 0.08em; color: var(--steel-dim); text-transform: uppercase; }
        .lp-creds-pass { font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.1em; color: var(--text-muted); margin-top: 8px; border-top: 1px solid var(--border-subtle); padding-top: 8px; }

        .lp-mode-tag {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.15em;
          color: var(--gold); border: 1px solid var(--border);
          padding: 3px 8px; margin-bottom: 16px; text-transform: uppercase;
        }

        .lp-mode-tag::before { content: ''; width: 5px; height: 5px; background: var(--gold); border-radius: 50%; }

        .lp-back-to-site {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.15em;
          color: var(--text-muted); text-transform: uppercase; text-decoration: none;
          margin-top: 20px; transition: color 0.15s;
        }
        .lp-back-to-site:hover { color: var(--gold); }
      `}</style>

      <div className="lp-root">
        <div className="lp-left">
          <div className="lp-wordmark">
            <div className="lp-shield">
              <Shield size={20} color="#080c12" strokeWidth={2.5} />
            </div>
            <span className="lp-brand-name">ClearClaim</span>
          </div>

          <div className="lp-classified-tag">AI Casework Platform — VSO Authorized</div>

          <h1 className="lp-headline">
            From 500 Pages<br />
            To a <span>Combat-Ready</span><br />
            Claim Packet
          </h1>

          <p className="lp-subhead">
            AI-powered intake that transforms service treatment records into
            structured, page-cited case packets — cutting caseworker time from
            3+ hours to under 40 minutes.
          </p>

          <div className="lp-stats">
            {stats.map((s) => (
              <div key={s.label} className="lp-stat">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-unit">{s.unit}</div>
                <div className="lp-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <a href="/" className="lp-back-to-site">
            <ChevronLeft size={10} /> Back to main site
          </a>
        </div>

        <div className="lp-divider" />

        <div className="lp-right">
          <div style={{ width: "100%", maxWidth: "400px" }}>
            <div className="lp-mobile-mark">
              <div className="lp-mobile-shield">
                <Shield size={16} color="#080c12" strokeWidth={2.5} />
              </div>
              <span className="lp-mobile-name">ClearClaim</span>
            </div>

            <div className="lp-card">
              <div className="lp-card-inner">
                {mode === "select" ? (
                  <>
                    <div className="lp-card-header">
                      <div className="lp-card-title">Access Portal</div>
                      <div className="lp-card-sub">Select authorization level</div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button className="lp-mode-btn" onClick={() => setMode("staff")}>
                        <div className="lp-mode-icon"><Briefcase size={18} /></div>
                        <div>
                          <div className="lp-mode-label">VSO Staff</div>
                          <div className="lp-mode-desc">Caseworkers, supervisors, admins</div>
                        </div>
                        <ArrowRight size={16} className="lp-mode-arrow" />
                      </button>

                      <button className="lp-mode-btn" onClick={() => setMode("veteran")}>
                        <div className="lp-mode-icon"><User size={18} /></div>
                        <div>
                          <div className="lp-mode-label">Veteran Portal</div>
                          <div className="lp-mode-desc">Track claim, upload documents</div>
                        </div>
                        <ArrowRight size={16} className="lp-mode-arrow" />
                      </button>
                    </div>

                    <div className="lp-sep">
                      <div className="lp-sep-line" />
                      <span className="lp-sep-label">Quick Demo</span>
                      <div className="lp-sep-line" />
                    </div>

                    <div className="lp-demo-grid">
                      <button className="lp-demo-btn" onClick={() => handleDemoLogin("staff")}>Demo / Staff</button>
                      <button className="lp-demo-btn" onClick={() => handleDemoLogin("veteran")}>Demo / Veteran</button>
                    </div>
                    <p className="lp-demo-hint">Pre-fills demo credentials</p>
                  </>
                ) : (
                  <>
                    <button className="lp-back-btn" onClick={() => { setMode("select"); setEmail(""); setPassword(""); }}>
                      <ChevronLeft size={12} /> Back
                    </button>

                    <div className="lp-mode-tag">
                      {mode === "staff" ? "VSO Staff Access" : "Veteran Portal Access"}
                    </div>

                    <div className="lp-form-header">
                      <div className="lp-form-icon">
                        {mode === "staff" ? <Briefcase size={18} /> : <User size={18} />}
                      </div>
                      <div>
                        <div className="lp-form-title">{mode === "staff" ? "Staff Sign In" : "Veteran Sign In"}</div>
                        <div className="lp-form-subtitle">{mode === "staff" ? "Casework platform access" : "Claim portal access"}</div>
                      </div>
                    </div>

                    <form onSubmit={handleLogin}>
                      <div className="lp-field">
                        <label className="lp-label" htmlFor="email">Email Address</label>
                        <input id="email" className="lp-input" type="email" value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={mode === "staff" ? "you@organization.org" : "your.email@example.com"}
                          required autoComplete="email" />
                      </div>
                      <div className="lp-field">
                        <label className="lp-label" htmlFor="password">Password</label>
                        <input id="password" className="lp-input" type="password" value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password" required minLength={6}
                          autoComplete="current-password" />
                      </div>
                      <button type="submit" className="lp-submit" disabled={loading}>
                        {loading ? "Authenticating..." : "Sign In"}
                      </button>
                    </form>

                    <div className="lp-creds">
                      <div className="lp-creds-title">Demo Accounts</div>
                      {mode === "staff" ? (
                        <>
                          {[
                            { email: "admin@clearclaim.demo", role: "Org Admin" },
                            { email: "caseworker@clearclaim.demo", role: "Caseworker" },
                            { email: "supervisor@clearclaim.demo", role: "Supervisor" },
                          ].map((a) => (
                            <div key={a.email} className="lp-creds-row">
                              <span className="lp-creds-email">{a.email}</span>
                              <span className="lp-creds-role">{a.role}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          {[
                            { email: "maria.garcia@veteran.demo", role: "Garcia" },
                            { email: "robert.johnson@veteran.demo", role: "Johnson" },
                            { email: "james.mitchell@veteran.demo", role: "Mitchell" },
                          ].map((a) => (
                            <div key={a.email} className="lp-creds-row">
                              <span className="lp-creds-email">{a.email}</span>
                              <span className="lp-creds-role">{a.role}</span>
                            </div>
                          ))}
                        </>
                      )}
                      <div className="lp-creds-pass">Password: demo1234</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
