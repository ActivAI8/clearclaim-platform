"use client";

import { useEffect, useState } from "react";

interface FullScreenLoaderProps {
  isLoading: boolean;
  brandName?: string;
  tagline?: string;
  accentColor?: string;
  minDuration?: number;
}

export default function FullScreenLoader({
  isLoading,
  brandName = "ClearClaim",
  tagline,
  accentColor = "#d4a843",
  minDuration = 2800,
}: FullScreenLoaderProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setMounted(true);
      setHoldOpen(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      const holdTimer = setTimeout(() => setHoldOpen(false), minDuration);
      return () => clearTimeout(holdTimer);
    }
  }, [isLoading, minDuration]);

  useEffect(() => {
    if (!isLoading && !holdOpen && mounted) {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isLoading, holdOpen, mounted]);

  if (!mounted) return null;

  // Neural Orbit config
  const orbits = [
    { rx: 90, ry: 70, rotation: 0, duration: 14, opacity: 0.15 },
    { rx: 80, ry: 85, rotation: 35, duration: 16, opacity: 0.12 },
    { rx: 95, ry: 60, rotation: -20, duration: 12, opacity: 0.1 },
    { rx: 70, ry: 90, rotation: 55, duration: 18, opacity: 0.08 },
  ];

  const particles = [
    { angle: 0, rx: 88, ry: 68, duration: 13, size: 2.5, opacity: 0.6, delay: 0 },
    { angle: 60, rx: 78, ry: 83, duration: 15, size: 2, opacity: 0.5, delay: -3 },
    { angle: 120, rx: 93, ry: 58, duration: 11, size: 3, opacity: 0.7, delay: -6 },
    { angle: 180, rx: 68, ry: 88, duration: 17, size: 2, opacity: 0.45, delay: -2 },
    { angle: 240, rx: 85, ry: 75, duration: 14, size: 2.5, opacity: 0.55, delay: -8 },
    { angle: 300, rx: 75, ry: 80, duration: 16, size: 1.8, opacity: 0.4, delay: -5 },
    { angle: 45, rx: 92, ry: 62, duration: 12, size: 1.5, opacity: 0.35, delay: -10 },
    { angle: 150, rx: 72, ry: 86, duration: 18, size: 2.2, opacity: 0.5, delay: -7 },
  ];

  // Node connection lines
  const connections = [
    { x1: -60, y1: -50, x2: 60, y2: -40, opacity: 0.06 },
    { x1: -40, y1: 60, x2: 50, y2: -60, opacity: 0.04 },
    { x1: -70, y1: 10, x2: 70, y2: 20, opacity: 0.05 },
  ];

  return (
    <>
      <style>{`
        .fsl-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(16px) saturate(1.2);
          -webkit-backdrop-filter: blur(16px) saturate(1.2);
          background: radial-gradient(
            ellipse at center,
            rgba(8,12,18,0.82) 0%,
            rgba(8,12,18,0.92) 50%,
            rgba(8,12,18,0.97) 100%
          );
          opacity: 0;
          transition: opacity 200ms ease-in-out;
          pointer-events: none;
        }
        .fsl-overlay.fsl-visible {
          opacity: 1;
          pointer-events: auto;
        }

        /* Vignette */
        .fsl-overlay::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse at center,
            transparent 40%,
            rgba(0,0,0,0.4) 100%
          );
          pointer-events: none;
        }

        .fsl-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Orbit container */
        .fsl-orbit-wrap {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fsl-breathe 6s ease-in-out infinite;
        }

        .fsl-orbit-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
        }

        /* Logo placeholder */
        .fsl-logo {
          position: relative;
          z-index: 2;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, ${accentColor}22, ${accentColor}44);
          border: 1.5px solid ${accentColor}55;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 30px ${accentColor}18, 0 0 60px ${accentColor}08;
        }
        .fsl-logo-icon {
          font-size: 22px;
          font-weight: 700;
          color: ${accentColor};
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 1px;
        }

        /* Brand text */
        .fsl-brand {
          margin-top: 24px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 6px;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 0 20px ${accentColor}30, 0 0 40px ${accentColor}10;
          text-transform: uppercase;
        }

        .fsl-tagline {
          margin-top: 8px;
          font-family: 'Barlow', sans-serif;
          font-size: 13px;
          letter-spacing: 3px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
        }

        /* Orbit stroke animation */
        @keyframes fsl-orbit-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Particle orbit */
        @keyframes fsl-particle-orbit {
          from { offset-distance: 0%; }
          to { offset-distance: 100%; }
        }

        /* Breathing scale */
        @keyframes fsl-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }

        /* Particle glow pulse */
        @keyframes fsl-glow-pulse {
          0%, 100% { opacity: var(--p-opacity); filter: blur(0px); }
          50% { opacity: calc(var(--p-opacity) * 1.4); filter: blur(0.5px); }
        }

        /* Connection line shimmer */
        @keyframes fsl-line-shimmer {
          0%, 100% { opacity: var(--l-opacity); }
          50% { opacity: calc(var(--l-opacity) * 2); }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .fsl-orbit-wrap {
            animation: fsl-breathe 8s ease-in-out infinite;
          }
          .fsl-orbit-wrap svg g {
            animation: none !important;
          }
          .fsl-orbit-wrap .fsl-particle {
            animation: fsl-glow-pulse 4s ease-in-out infinite !important;
          }
        }
      `}</style>

      <div className={`fsl-overlay ${visible ? "fsl-visible" : ""}`}>
        <div className="fsl-content">
          <div className="fsl-orbit-wrap">
            <svg
              className="fsl-orbit-svg"
              viewBox="-110 -110 220 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Connection lines */}
              {connections.map((c, i) => (
                <line
                  key={`conn-${i}`}
                  x1={c.x1}
                  y1={c.y1}
                  x2={c.x2}
                  y2={c.y2}
                  stroke={accentColor}
                  strokeWidth="0.5"
                  style={{
                    "--l-opacity": c.opacity,
                    opacity: c.opacity,
                    animation: `fsl-line-shimmer ${8 + i * 2}s ease-in-out infinite`,
                    animationDelay: `${-i * 3}s`,
                  } as React.CSSProperties}
                />
              ))}

              {/* Orbit ellipses */}
              {orbits.map((o, i) => (
                <g
                  key={`orbit-${i}`}
                  style={{
                    animation: `fsl-orbit-rotate ${o.duration}s linear infinite`,
                    transformOrigin: "center",
                    animationDirection: i % 2 === 0 ? "normal" : "reverse",
                  }}
                >
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={o.rx}
                    ry={o.ry}
                    transform={`rotate(${o.rotation})`}
                    stroke={accentColor}
                    strokeWidth="0.8"
                    opacity={o.opacity}
                    strokeDasharray="4 8"
                  />
                </g>
              ))}

              {/* Orbiting particles */}
              {particles.map((p, i) => {
                const pathId = `fsl-path-${i}`;
                return (
                  <g key={`particle-${i}`}>
                    <ellipse
                      id={pathId}
                      cx="0"
                      cy="0"
                      rx={p.rx}
                      ry={p.ry}
                      fill="none"
                      stroke="none"
                    />
                    <circle
                      className="fsl-particle"
                      r={p.size}
                      fill={accentColor}
                      style={{
                        "--p-opacity": p.opacity,
                        opacity: p.opacity,
                        offsetPath: `path("M ${p.rx} 0 A ${p.rx} ${p.ry} 0 1 1 ${p.rx} -0.01 Z")`,
                        animation: `fsl-particle-orbit ${p.duration}s linear infinite, fsl-glow-pulse ${p.duration * 0.6}s ease-in-out infinite`,
                        animationDelay: `${p.delay}s`,
                        filter: `drop-shadow(0 0 ${p.size * 2}px ${accentColor})`,
                      } as React.CSSProperties}
                    />
                  </g>
                );
              })}

              {/* Center glow */}
              <circle
                cx="0"
                cy="0"
                r="32"
                fill={`url(#fsl-center-glow)`}
              />
              <defs>
                <radialGradient id="fsl-center-glow">
                  <stop offset="0%" stopColor={accentColor} stopOpacity="0.06" />
                  <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
                </radialGradient>
              </defs>
            </svg>

            {/* Logo */}
            <div className="fsl-logo">
              <span className="fsl-logo-icon">CC</span>
            </div>
          </div>

          <div className="fsl-brand">{brandName}</div>
          {tagline && <div className="fsl-tagline">{tagline}</div>}
        </div>
      </div>
    </>
  );
}
