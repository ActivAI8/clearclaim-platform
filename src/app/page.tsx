import Link from "next/link";

export default function MarketingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Barlow:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --obsidian: #080c12;
          --surface: #0d1520;
          --surface-2: #111a27;
          --surface-3: #16202f;
          --gold: #d4a843;
          --gold-dim: #a07c2a;
          --gold-pale: rgba(212,168,67,0.08);
          --gold-glow: rgba(212,168,67,0.15);
          --steel: #7a9ab8;
          --steel-dim: #4a6a88;
          --text: #e8edf3;
          --text-dim: #8a9bb0;
          --text-muted: #4a5a6a;
          --border: rgba(212,168,67,0.12);
          --border-subtle: rgba(120,160,200,0.08);
          --green: #22c55e;
          --red: #ef4444;
          --font-display: 'Bebas Neue', sans-serif;
          --font-ui: 'Barlow Condensed', sans-serif;
          --font-body: 'Barlow', sans-serif;
          --font-mono: 'IBM Plex Mono', monospace;
        }

        html { scroll-behavior: smooth; }

        body {
          background: var(--obsidian);
          color: var(--text);
          font-family: var(--font-body);
          overflow-x: hidden;
        }

        .mkt-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }
        .mkt-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(120,160,210,0.055) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .mkt-bg::after {
          content: '';
          position: absolute;
          top: -300px; left: 50%;
          transform: translateX(-50%);
          width: 1200px; height: 800px;
          background: radial-gradient(ellipse, rgba(212,168,67,0.06) 0%, transparent 60%);
        }

        /* NAV */
        .mkt-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          height: 64px;
          background: rgba(8,12,18,0.9);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .mkt-nav-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .mkt-nav-hex {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          clip-path: polygon(50% 0%, 100% 20%, 100% 65%, 50% 100%, 0% 65%, 0% 20%);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        .mkt-nav-name {
          font-family: var(--font-display);
          font-size: 22px;
          letter-spacing: 0.08em;
          color: var(--text);
        }

        .mkt-nav-links {
          display: none;
          align-items: center;
          gap: 32px;
          list-style: none;
        }

        @media (min-width: 768px) { .mkt-nav-links { display: flex; } }

        .mkt-nav-links a {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .mkt-nav-links a:hover { color: var(--gold); }

        .mkt-nav-cta { display: flex; align-items: center; gap: 12px; }

        .mkt-btn-ghost {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          text-decoration: none;
          text-transform: uppercase;
          padding: 8px 16px;
          border: 1px solid var(--border-subtle);
          transition: all 0.15s;
        }
        .mkt-btn-ghost:hover { color: var(--gold); border-color: var(--border); }

        .mkt-btn-gold {
          font-family: var(--font-ui);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--obsidian);
          text-decoration: none;
          text-transform: uppercase;
          padding: 9px 20px;
          background: linear-gradient(135deg, var(--gold), var(--gold-dim));
          transition: all 0.15s;
          white-space: nowrap;
        }
        .mkt-btn-gold:hover { filter: brightness(1.1); }

        section { position: relative; z-index: 1; }

          /* HERO VIDEO BACKDROP */
          .hero-video-wrap {
            position: relative;
            min-height: 100vh;
            overflow: hidden;
          }
          .hero-video-bg {
            position: absolute;
            inset: 0;
            z-index: 0;
          }
          .hero-video-bg video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .hero-video-overlay {
            position: absolute;
            inset: 0;
            background: linear-gradient(
              180deg,
              rgba(8,12,18,0.8) 0%,
              rgba(13,21,32,0.55) 40%,
              rgba(212,168,67,0.03) 50%,
              rgba(8,12,18,0.9) 100%
            );
            z-index: 1;
          }

          /* HERO */
          .hero {
            position: relative;
            z-index: 2;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 120px 24px 80px;
          }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.25em;
          color: var(--gold);
          border: 1px solid var(--border);
          padding: 5px 14px;
          margin-bottom: 32px;
          text-transform: uppercase;
          animation: fade-up 0.6s ease both;
        }

        .hero-eyebrow-dot {
          width: 6px; height: 6px;
          background: var(--gold);
          border-radius: 50%;
          animation: pulse-dot 2s ease-in-out infinite;
        }

          @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
          @keyframes fade-up { from{opacity:0;transform:translateY(20px);} to{opacity:1;transform:translateY(0);} }

          .hero-salute {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 28px;
            animation: fade-up 0.65s 0.05s ease both;
          }
          .hero-salute-rule {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--border), transparent);
            max-width: 120px;
          }
            .hero-salute-tag {
              font-family: var(--font-mono);
              font-size: 9px;
              letter-spacing: 0.35em;
              color: var(--gold);
              text-transform: uppercase;
              white-space: nowrap;
            }

          .hero-headline {
          font-family: var(--font-display);
          font-size: clamp(52px, 9vw, 120px);
          line-height: 0.92;
          letter-spacing: 0.02em;
          color: #fff;
          max-width: 980px;
          animation: fade-up 0.7s 0.1s ease both;
          text-shadow: 0 2px 20px rgba(0,0,0,0.6);
        }
        .hero-headline em { font-style: normal; color: var(--gold); }
        .hero-headline .hero-line-dim { color: #fff; }

          .hero-sub {
            font-family: var(--font-body);
            font-weight: 600;
          font-size: clamp(15px, 1.8vw, 18px);
          line-height: 1.7;
          color: rgba(255,255,255,0.9);
          max-width: 580px;
          margin: 28px auto 0;
          animation: fade-up 0.7s 0.2s ease both;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
          margin-top: 44px;
          animation: fade-up 0.7s 0.3s ease both;
        }

        .hero-btn-primary {
          font-family: var(--font-display);
          font-size: 20px;
          letter-spacing: 0.08em;
          color: var(--obsidian);
          text-decoration: none;
          padding: 14px 36px;
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .hero-btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }

        .hero-btn-secondary {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          padding: 14px 28px;
          border: 1px solid rgba(255,255,255,0.3);
          text-transform: uppercase;
          transition: all 0.15s;
        }
        .hero-btn-secondary:hover { color: var(--gold); border-color: var(--border); }

        .hero-stats {
          display: flex;
          align-items: stretch;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          margin-top: 64px;
          animation: fade-up 0.7s 0.4s ease both;
          flex-wrap: wrap;
        }

        .hero-stat {
          background: var(--surface);
          padding: 20px 36px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
          flex: 1;
          min-width: 120px;
        }
        .hero-stat::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .hero-stat:hover { background: var(--surface-2); }
        .hero-stat:hover::before { opacity: 1; }

        .hero-stat-num {
          font-family: var(--font-display);
          font-size: 44px;
          letter-spacing: 0.03em;
          color: var(--gold);
          line-height: 1;
        }
        .hero-stat-label {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-top: 4px;
        }
        .hero-stat-sub {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 3px;
        }

        /* PAIN */
        .section-pain {
          padding: 100px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .section-label {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.25em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 16px;
        }

        .section-headline {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 64px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: var(--text);
          margin-bottom: 20px;
        }
        .section-headline em { font-style: normal; color: var(--gold); }

        .section-body {
          font-family: var(--font-body);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.75;
          color: var(--text-dim);
          max-width: 560px;
          margin-bottom: 52px;
        }

        .pain-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        @media (min-width: 640px) { .pain-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .pain-grid { grid-template-columns: 1fr 1fr 1fr; } }

        .pain-card {
          background: var(--surface);
          padding: 28px 28px 24px;
          position: relative;
          overflow: hidden;
        }
        .pain-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--red), transparent);
          opacity: 0.5;
        }
        .pain-num {
          font-family: var(--font-display);
          font-size: 52px;
          line-height: 1;
          letter-spacing: 0.03em;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .pain-title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .pain-desc {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-dim);
          font-weight: 300;
        }

        /* HOW IT WORKS */
        .section-how {
          padding: 100px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .how-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2px;
          margin-top: 56px;
          background: var(--border);
          border: 1px solid var(--border);
        }
        @media (min-width: 768px) { .how-steps { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .how-steps { grid-template-columns: repeat(4, 1fr); } }

        .how-step {
          background: var(--surface);
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .how-step::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .how-step:hover { background: var(--surface-2); }
        .how-step:hover::before { opacity: 1; }

        .how-step-num {
          font-family: var(--font-display);
          font-size: 64px;
          line-height: 1;
          color: var(--surface-3);
          position: absolute;
          top: 12px; right: 20px;
          letter-spacing: 0.02em;
          pointer-events: none;
          transition: color 0.2s;
        }
        .how-step:hover .how-step-num { color: rgba(22,32,47,0.8); }

        .how-step-icon {
          width: 44px; height: 44px;
          border: 1px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
          font-size: 20px;
          position: relative; z-index: 1;
        }
        .how-step-title {
          font-family: var(--font-ui);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
          margin-bottom: 10px;
          position: relative; z-index: 1;
        }
        .how-step-desc {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.65;
          color: var(--text-dim);
          font-weight: 300;
          position: relative; z-index: 1;
        }
        .how-step-tag {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 8px;
          letter-spacing: 0.15em;
          color: var(--gold);
          border: 1px solid var(--border);
          padding: 2px 6px;
          margin-top: 14px;
          text-transform: uppercase;
          position: relative; z-index: 1;
        }

        /* FEATURES */
        .section-features {
          padding: 100px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          margin-top: 56px;
        }
        @media (min-width: 640px) { .features-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .features-grid { grid-template-columns: 1fr 1fr 1fr; } }

        .feature-card {
          background: var(--surface);
          padding: 28px;
          position: relative;
          overflow: hidden;
          transition: background 0.2s;
        }
        .feature-card:hover { background: var(--surface-2); }

        .feature-card-accent {
          position: absolute;
          top: 0; left: 0; bottom: 0; width: 3px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .feature-card:hover .feature-card-accent { opacity: 1; }

        .feature-icon-box {
          width: 40px; height: 40px;
          border: 1px solid var(--border-subtle);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
          margin-bottom: 16px;
          transition: border-color 0.2s;
        }
        .feature-card:hover .feature-icon-box { border-color: var(--border); }

        .feature-title {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text);
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .feature-desc {
          font-family: var(--font-body);
          font-size: 13px;
          line-height: 1.6;
          color: var(--text-dim);
          font-weight: 300;
        }

        /* ROLES */
        .section-roles {
          padding: 100px 24px;
          max-width: 1100px;
          margin: 0 auto;
        }

        .roles-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-top: 56px;
        }
        @media (min-width: 768px) { .roles-grid { grid-template-columns: 1fr 1fr; } }

        .role-card {
          background: var(--surface);
          border: 1px solid var(--border-subtle);
          padding: 36px 32px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .role-card:hover { border-color: var(--border); }
        .role-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 2px;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .role-card:hover::before { opacity: 1; }
        .role-card-vso::before { background: linear-gradient(90deg, var(--gold), transparent); }
        .role-card-vet::before { background: linear-gradient(90deg, var(--steel), transparent); }

        .role-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          border: 1px solid;
          padding: 3px 8px;
          margin-bottom: 20px;
        }
        .role-badge-vso { color: var(--gold); border-color: var(--border); }
        .role-badge-vet { color: var(--steel); border-color: rgba(120,154,184,0.2); }

        .role-badge-dot { width: 5px; height: 5px; border-radius: 50%; }
        .role-badge-vso .role-badge-dot { background: var(--gold); }
        .role-badge-vet .role-badge-dot { background: var(--steel); }

        .role-title {
          font-family: var(--font-display);
          font-size: 36px;
          line-height: 1;
          letter-spacing: 0.03em;
          color: var(--text);
          margin-bottom: 12px;
        }
        .role-sub {
          font-family: var(--font-body);
          font-weight: 300;
          font-size: 14px;
          line-height: 1.6;
          color: var(--text-dim);
          margin-bottom: 24px;
        }

        .role-list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
        .role-list li {
          display: flex; align-items: flex-start; gap: 10px;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--text-dim);
          font-weight: 300;
          line-height: 1.5;
        }
        .role-check {
          width: 16px; height: 16px;
          border: 1px solid;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
          font-size: 9px;
          font-weight: 700;
        }
        .role-card-vso .role-check { border-color: var(--gold-dim); color: var(--gold); }
        .role-card-vet .role-check { border-color: var(--steel-dim); color: var(--steel); }

        /* PROOF */
        .section-proof {
          padding: 100px 24px;
          background: var(--surface);
          border-top: 1px solid var(--border-subtle);
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        .section-proof::before {
          content: '';
          position: absolute; inset: 0;
          background-image: radial-gradient(circle, rgba(120,160,210,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
        }

        .proof-inner {
          max-width: 900px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .proof-mark {
          font-family: var(--font-display);
          font-size: 80px;
          line-height: 1;
          color: var(--gold);
          opacity: 0.3;
          margin-bottom: -20px;
          display: block;
        }
        .proof-quote {
          font-family: var(--font-ui);
          font-size: clamp(20px, 3vw, 30px);
          font-weight: 300;
          line-height: 1.5;
          letter-spacing: 0.02em;
          color: var(--text);
          max-width: 760px;
          margin: 0 auto 28px;
        }
        .proof-quote strong { color: var(--gold); font-weight: 600; }
        .proof-attr {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .proof-metrics {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          background: var(--border);
          border: 1px solid var(--border);
          margin-top: 60px;
          flex-wrap: wrap;
        }
        .proof-metric {
          background: var(--surface-2);
          padding: 20px 40px;
          text-align: center;
          flex: 1;
          min-width: 140px;
        }
        .proof-metric-val {
          font-family: var(--font-display);
          font-size: 40px;
          color: var(--gold);
          letter-spacing: 0.04em;
          line-height: 1;
        }
        .proof-metric-label {
          font-family: var(--font-ui);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          color: var(--text-dim);
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* CTA */
        .section-cta {
          padding: 120px 24px;
          text-align: center;
          position: relative;
          z-index: 1;
          overflow: hidden;
        }
        .section-cta::before {
          content: '';
          position: absolute;
          bottom: -200px; left: 50%;
          transform: translateX(-50%);
          width: 800px; height: 600px;
          background: radial-gradient(ellipse, rgba(212,168,67,0.07) 0%, transparent 65%);
          pointer-events: none;
        }

        .cta-inner {
          max-width: 700px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .cta-headline {
          font-family: var(--font-display);
          font-size: clamp(48px, 7vw, 88px);
          line-height: 0.95;
          letter-spacing: 0.02em;
          color: var(--text);
          margin-bottom: 24px;
        }
        .cta-headline em { font-style: normal; color: var(--gold); }
        .cta-sub {
          font-family: var(--font-body);
          font-weight: 300;
          font-size: 16px;
          line-height: 1.7;
          color: var(--text-dim);
          margin-bottom: 44px;
        }
        .cta-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

        .cta-btn-primary {
          font-family: var(--font-display);
          font-size: 22px;
          letter-spacing: 0.08em;
          color: var(--obsidian);
          text-decoration: none;
          padding: 16px 44px;
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
          transition: all 0.2s;
        }
        .cta-btn-primary:hover { filter: brightness(1.1); transform: translateY(-2px); }

        .cta-btn-outline {
          font-family: var(--font-ui);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          text-decoration: none;
          text-transform: uppercase;
          padding: 16px 28px;
          border: 1px solid var(--border);
          transition: all 0.15s;
        }
        .cta-btn-outline:hover { color: var(--gold); border-color: var(--gold); }

        .cta-note {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.15em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-top: 20px;
        }

        /* FOOTER */
        .mkt-footer {
          position: relative;
          z-index: 1;
          border-top: 1px solid var(--border-subtle);
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .footer-left { display: flex; align-items: center; gap: 10px; }
        .footer-hex {
          width: 28px; height: 28px;
          background: linear-gradient(135deg, var(--gold-dim), rgba(160,124,42,0.5));
          clip-path: polygon(50% 0%, 100% 20%, 100% 65%, 50% 100%, 0% 65%, 0% 20%);
        }
        .footer-name {
          font-family: var(--font-display);
          font-size: 18px;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }
        .footer-copy {
          font-family: var(--font-mono);
          font-size: 9px;
          letter-spacing: 0.12em;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .footer-links { display: flex; gap: 24px; list-style: none; }
        .footer-links a {
          font-family: var(--font-ui);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          text-decoration: none;
          text-transform: uppercase;
          transition: color 0.15s;
        }
        .footer-links a:hover { color: var(--gold); }

        .h-rule { width: 100%; height: 1px; background: var(--border-subtle); position: relative; z-index: 1; }
      `}</style>

      <div className="mkt-bg" />

      {/* NAV */}
      <nav className="mkt-nav">
        <Link href="/" className="mkt-nav-logo">
          <div className="mkt-nav-hex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <span className="mkt-nav-name">ClearClaim</span>
        </Link>

        <ul className="mkt-nav-links">
          <li><a href="#how-it-works">How It Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#for-vsos">For VSOs</a></li>
          <li><a href="#demo">Demo</a></li>
        </ul>

        <div className="mkt-nav-cta">
          <Link href="/login" className="mkt-btn-ghost">Sign In</Link>
          <Link href="/login" className="mkt-btn-gold">Access Portal</Link>
        </div>
      </nav>

          {/* HERO */}
          <div className="hero-video-wrap">
            <div className="hero-video-bg">
              <video autoPlay muted loop playsInline>
                <source src="/202602191850.mp4" type="video/mp4" />
              </video>
            </div>
            <div className="hero-video-overlay" />
          <section className="hero" id="hero">
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-dot" />
            <span className="hero-eyebrow-text">For Those Who Served — Powered by VSOs Who Care</span>
          </div>

          <div className="hero-salute">
            <span className="hero-salute-rule" />
            <span className="hero-salute-tag">IN SERVICE TO THOSE WHO SERVED</span>
            <span className="hero-salute-rule" />
          </div>

          <h1 className="hero-headline">
            You Earned<br />
            Every <em>Dollar.</em><br />
            <span className="hero-line-dim">We&apos;re Here to Help You Claim It.</span>
          </h1>

          <p className="hero-sub">
            Veterans carried the weight so others wouldn&apos;t have to. Now the paperwork
            buries what they&apos;re owed. ClearClaim gives VSOs the AI firepower to cut through
            thousands of pages of service records — and get every veteran the rating they deserve, faster.
          </p>

          <div className="hero-actions">
            <Link href="/login" className="hero-btn-primary">
              Access the Platform
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <a href="#how-it-works" className="hero-btn-secondary">See How It Works</a>
          </div>

          <div className="hero-stats">
            {[
              { num: "80%", label: "Faster Claims", sub: "vs. manual review" },
              { num: "3hrs", label: "Saved Per Veteran", sub: "avg caseworker time" },
              { num: "100%", label: "Evidence Cited", sub: "every page referenced" },
              { num: "30%", label: "Denial Rate Cut", sub: "stronger first submissions" },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <div className="hero-stat-num">{s.num}</div>
                <div className="hero-stat-label">{s.label}</div>
                <div className="hero-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
          </section>
          </div>

        <div className="h-rule" />

        {/* PROBLEM */}
      <section className="section-pain" id="problem">
        <div className="section-label">The Problem</div>
        <h2 className="section-headline">
          The VA claims process<br />is <em>broken by design</em>
        </h2>
        <p className="section-body">
          Veterans deserve full benefits, but the system buries their evidence in
          thousands of pages of records that caseworkers don&apos;t have time to read.
          Deserving veterans get denied. VSOs burn out.
        </p>

        <div className="pain-grid">
          {[
            { n: "500+", title: "Pages Per Veteran", desc: "Average STR packet a caseworker must manually review before building a single claim." },
            { n: "3hrs", title: "Per Case, Minimum", desc: "Time a skilled VSO caseworker spends on intake alone — before any strategy work begins." },
            { n: "30%", title: "Initial Denial Rate", desc: "Veterans denied on first submission due to missing nexus letters or uncited evidence." },
            { n: "12mo", title: "Average Wait Time", desc: "Time from claim submission to VA decision — made worse by incomplete initial packets." },
            { n: "∞", title: "Institutional Memory", desc: "Critical rating knowledge locked in senior caseworkers&apos; heads — impossible to scale." },
            { n: "0", title: "Veteran Visibility", desc: "Most veterans have no idea what&apos;s in their records or where their claim stands today." },
          ].map((p) => (
            <div key={p.n} className="pain-card">
              <div className="pain-num">{p.n}</div>
              <div className="pain-title">{p.title}</div>
              <div className="pain-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-rule" />

      {/* HOW IT WORKS */}
      <section className="section-how" id="how-it-works">
        <div className="section-label">The Solution</div>
        <h2 className="section-headline">
          Four steps from<br /><em>records to ready</em>
        </h2>
        <p className="section-body">
          ClearClaim automates the most time-consuming parts of the claims process
          so your team can focus on strategy, not paper.
        </p>

        <div className="how-steps">
          {[
            { icon: "📁", title: "Upload STRs", desc: "Drag and drop service treatment records, DD-214s, imaging reports, and any supporting documents.", tag: "Secure Upload", n: "01" },
            { icon: "🔬", title: "AI Extraction", desc: "Our model reads every page, identifies conditions, symptoms, dates, and service connections with page-level citations.", tag: "OCR + LLM", n: "02" },
            { icon: "⚖️", title: "Rating Strategy", desc: "Conditions are mapped to VASRD diagnostic codes. Evidence gaps are flagged. AI recommends nexus strategies.", tag: "VASRD-Aware", n: "03" },
            { icon: "📋", title: "Packet Ready", desc: "Caseworker reviews and approves an AI-assembled claim packet — fully cited, formatted, and submission-ready.", tag: "One-Click Export", n: "04" },
          ].map((s) => (
            <div key={s.n} className="how-step">
              <div className="how-step-num">{s.n}</div>
              <div className="how-step-icon">{s.icon}</div>
              <div className="how-step-title">{s.title}</div>
              <div className="how-step-desc">{s.desc}</div>
              <span className="how-step-tag">{s.tag}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="h-rule" />

      {/* FEATURES */}
      <section className="section-features" id="features">
        <div className="section-label">Platform Capabilities</div>
        <h2 className="section-headline">
          Every tool your<br />team <em>actually needs</em>
        </h2>

        <div className="features-grid">
          {[
            { icon: "🧠", accent: "linear-gradient(180deg, var(--gold), transparent)", title: "AI Document Intelligence", desc: "Full OCR extraction with LLM-powered condition identification, symptom mapping, and page-level evidence citations." },
            { icon: "📊", accent: "linear-gradient(180deg, #3b82f6, transparent)", title: "VASRD Rating Predictor", desc: "Every identified condition is automatically matched to VA Schedule for Rating Disabilities codes with guidance." },
            { icon: "📬", accent: "linear-gradient(180deg, #22c55e, transparent)", title: "Veteran Portal", desc: "Veterans track claim progress, upload documents, message their VSO, and see their readiness score in real time." },
            { icon: "✍️", accent: "linear-gradient(180deg, var(--gold), transparent)", title: "Nexus Letter Generator", desc: "AI drafts medically sound nexus letters connecting service events to current diagnoses — reviewed by caseworker." },
            { icon: "⚠️", accent: "linear-gradient(180deg, #f59e0b, transparent)", title: "Evidence Gap Analysis", desc: "Automatically flags missing buddy statements, imaging, or treatment records before submission — preventing denials." },
            { icon: "👥", accent: "linear-gradient(180deg, #8b5cf6, transparent)", title: "Multi-Staff Workflow", desc: "Caseworkers, supervisors, and admins each have role-appropriate views. Assign cases, track workload, flag for review." },
            { icon: "💬", accent: "linear-gradient(180deg, var(--steel), transparent)", title: "Secure Messaging", desc: "Encrypted in-platform messaging between veterans and VSO staff. No personal email, no document sharing via SMS." },
            { icon: "📦", accent: "linear-gradient(180deg, #22c55e, transparent)", title: "Packet Export", desc: "One-click export of the fully assembled claim packet — page-cited, formatted for VA submission standards." },
            { icon: "🔒", accent: "linear-gradient(180deg, var(--gold-dim), transparent)", title: "SOC 2 Ready", desc: "Built with military-grade security practices. Role-based access control, encrypted storage, full audit logging." },
          ].map((f) => (
            <div key={f.title} className="feature-card">
              <div className="feature-card-accent" style={{ background: f.accent }} />
              <div className="feature-icon-box">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="h-rule" />

      {/* ROLES */}
      <section className="section-roles" id="for-vsos">
        <div className="section-label">Built For Everyone</div>
        <h2 className="section-headline">
          One platform,<br /><em>two portals</em>
        </h2>
        <p className="section-body">
          ClearClaim serves both the caseworker and the veteran with tailored
          tools for each — connected in real time.
        </p>

        <div className="roles-grid">
          <div className="role-card role-card-vso">
            <div className="role-badge role-badge-vso">
              <span className="role-badge-dot" />
              For VSO Staff
            </div>
            <div className="role-title">Caseworker Intelligence Center</div>
            <p className="role-sub">
              A full command view of every case in your organization — prioritized by readiness score,
              flagged by AI-detected gaps, and ready for strategic action.
            </p>
            <ul className="role-list">
              {["AI-assembled intake packets with page citations", "VASRD diagnostic code mapping & rating estimates", "Supervisor review workflow and case assignment", "Nexus letter drafting and evidence gap alerts", "Org-wide caseload dashboard with priority queue"].map((item) => (
                <li key={item}><span className="role-check">✓</span>{item}</li>
              ))}
            </ul>
          </div>

          <div className="role-card role-card-vet">
            <div className="role-badge role-badge-vet">
              <span className="role-badge-dot" />
              For Veterans
            </div>
            <div className="role-title">Veteran Claim Portal</div>
            <p className="role-sub">
              Full transparency into where your claim stands, what documents are needed,
              and direct secure communication with your VSO caseworker.
            </p>
            <ul className="role-list">
              {["Real-time claim readiness score and progress tracker", "Drag-and-drop document upload with AI processing", "Task checklist — see exactly what&apos;s needed next", "Secure messaging with your assigned caseworker", "View conditions, evidence, and rating estimates"].map((item) => (
                <li key={item}><span className="role-check">✓</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* PROOF */}
      <section className="section-proof">
        <div className="proof-inner">
          <span className="proof-mark">&ldquo;</span>
          <p className="proof-quote">
            Before ClearClaim, our team spent <strong>3 hours per veteran</strong> just on intake.
            Now we spend that time on strategy — and our veterans are seeing
            <strong> dramatically better outcomes</strong> on first submission.
          </p>
          <div className="proof-attr">— VSO Chapter Director, Texas</div>

          <div className="proof-metrics">
            {[
              { val: "3×", label: "More Cases Per Caseworker" },
              { val: "40min", label: "Average Intake Time" },
              { val: "94%", label: "First-Submission Accuracy" },
              { val: "Zero", label: "Missing Citation Denials" },
            ].map((m) => (
              <div key={m.label} className="proof-metric">
                <div className="proof-metric-val">{m.val}</div>
                <div className="proof-metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-cta" id="demo">
        <div className="cta-inner">
          <div className="section-label" style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
            Ready To Deploy
          </div>
          <h2 className="cta-headline">
            See it live.<br />
            <em>In under 5 minutes.</em>
          </h2>
          <p className="cta-sub">
            No setup required. Access our full demo with three pre-loaded veteran personas,
            real AI processing, and a complete VSO staff dashboard.
          </p>
          <div className="cta-actions">
            <Link href="/login" className="cta-btn-primary">Access Demo Portal</Link>
            <Link href="/demo" className="cta-btn-outline">View Demo Script</Link>
          </div>
          <p className="cta-note">Pre-seeded with real demo data · No account required · Use demo credentials</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mkt-footer">
        <div className="footer-left">
          <div className="footer-hex" />
          <span className="footer-name">ClearClaim</span>
        </div>
        <span className="footer-copy">© 2026 ClearClaim · AI-Powered VA Claims Platform</span>
        <ul className="footer-links">
          <li><Link href="/login">Sign In</Link></li>
          <li><Link href="/demo">Demo</Link></li>
        </ul>
      </footer>
    </>
  );
}
