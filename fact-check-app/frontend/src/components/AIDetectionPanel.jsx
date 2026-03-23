import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, AlertCircle, Copy, Share2, RefreshCcw } from 'lucide-react';

export const AIDetectionPanel = ({ detectionResult }) => {
  if (!detectionResult) return null;

  const { aiProbability, signals, summary } = detectionResult;
  const pct     = Math.round((aiProbability || 0) * 100);
  const isAI    = pct > 70;
  const isMixed = pct > 40 && pct <= 70;
  const color   = isAI ? '#FF3D57' : isMixed ? '#FFAB00' : '#00E5FF';
  const label   = isAI ? 'AI Generated' : isMixed ? 'Mixed Origin' : 'Human Authored';
  const Icon    = isAI ? AlertCircle : isMixed ? Activity : ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        borderTop: `3px solid ${color}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Section label bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} style={{ color: '#556070' }} />
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
            Forensic AI Detection
          </span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', border: '1px solid rgba(59,73,76,0.4)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Bonus Module
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>

        {/* LEFT — Verdict hero */}
        <div style={{
          padding: '2rem 1.75rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          position: 'relative', overflow: 'hidden', textAlign: 'center',
        }}>
          {/* Background glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 160, height: 160, borderRadius: '50%', backgroundColor: color, opacity: 0.07, filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Badge */}
          <div style={{ marginBottom: '1rem', padding: '4px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Verification Verdict
            </span>
          </div>

          <Icon size={40} style={{ color, marginBottom: '1rem', filter: `drop-shadow(0 0 12px ${color}66)` }} />

          <h2 style={{
            fontFamily: 'Space Grotesk', fontWeight: 900,
            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
            color: '#e3e2e8', letterSpacing: '-0.03em',
            textTransform: 'uppercase', fontStyle: 'italic',
            marginBottom: '0.75rem', lineHeight: 1,
          }}>
            {label}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1.25rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} className="animate-pulse" />
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#bac9cc', letterSpacing: '0.05em' }}>
              Forensic Confidence: <strong style={{ color: '#e3e2e8' }}>{100 - pct}% Human</strong>
            </span>
          </div>

          {/* Signal pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6 }}>
            {signals?.map((sig, i) => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 999,
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontFamily: 'IBM Plex Mono', fontSize: 9,
                color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                {sig}
              </span>
            ))}
          </div>
        </div>

        {/* RIGHT — Gauge + Analysis */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Gauge section */}
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: '1.5rem',
          }}>
            {/* Circle gauge */}
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={color} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray="264"
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * (pct / 100)) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 22, color: '#e3e2e8', lineHeight: 1 }}>{pct}%</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 8, color: '#556070', textTransform: 'uppercase', marginTop: 3 }}>AI Score</span>
              </div>
            </div>

            {/* Human bar */}
            <div style={{ flex: 1 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                Probability Matrix
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Human</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#00E5FF' }}>{100 - pct}%</span>
              </div>
              <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', backgroundColor: '#00E5FF', borderRadius: 2 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI</span>
                <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color }}>  {pct}%</span>
              </div>
              <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                  style={{ height: '100%', backgroundColor: color, borderRadius: 2 }}
                />
              </div>
            </div>
          </div>

          {/* Analysis text */}
          <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
              <Activity size={12} style={{ color: '#556070' }} />
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Linguistic Analysis
              </span>
            </div>
            <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.65, marginBottom: '1.25rem' }}>
              {summary}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => { navigator.clipboard.writeText(summary); alert('Summary copied!'); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#bac9cc', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Copy size={11} /> Copy Summary
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#bac9cc', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <Share2 size={11} /> Share
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: '#00E5FF', border: 'none', color: '#00363d', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 0 10px rgba(0,229,255,0.25)' }}>
                <RefreshCcw size={11} /> Re-Analyze
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
