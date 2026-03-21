import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VERDICT_CFG = {
  'True':           { color: '#00E5FF', bg: 'rgba(0,229,255,0.1)',  border: 'rgba(0,229,255,0.25)', left: '#00E5FF', icon: 'show_chart'    },
  'False':          { color: '#FF3D57', bg: 'rgba(255,61,87,0.1)',  border: 'rgba(255,61,87,0.25)', left: '#FF3D57', icon: 'warning'        },
  'Partially True': { color: '#FFAB00', bg: 'rgba(255,171,0,0.1)',  border: 'rgba(255,171,0,0.25)', left: '#FFAB00', icon: 'balance'        },
  'Unverifiable':   { color: '#556070', bg: 'rgba(85,96,112,0.1)', border: 'rgba(85,96,112,0.25)',  left: '#556070', icon: 'visibility_off' },
};

export default function ClaimCard({ claimData, onViewSources }) {
  const [expanded, setExpanded] = useState(false);
  const { claim, verdict, confidenceScore, reasoning, conflictingEvidence, conflictNote, temporallySensitive, citations, id } = claimData;
  const cfg = VERDICT_CFG[verdict] || VERDICT_CFG['Unverifiable'];
  const pct = Math.round((confidenceScore || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="animate-fade-up"
      style={{
        backgroundColor: '#161820',
        borderLeft: `4px solid ${cfg.left}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Verdict + confidence */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 10,
              padding: '3px 8px', textTransform: 'uppercase',
              color: cfg.color, backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`, borderRadius: 2,
              letterSpacing: '0.05em',
            }}>
              {verdict}
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Confidence: {pct}%
            </span>
            {id && <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: 'rgba(186,201,204,0.3)', marginLeft: 'auto' }}>[{id}]</span>}
          </div>

          {/* Claim text */}
          <p style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 16, color: '#e3e2e8', lineHeight: 1.5 }}>
            "{claim}"
          </p>

          {/* Confidence bar */}
          <div style={{ width: '100%', height: 3, backgroundColor: '#343439', borderRadius: 2, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', backgroundColor: cfg.color, borderRadius: 2 }}
            />
          </div>

          {/* Flags */}
          {conflictingEvidence && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.2)', padding: '0.6rem 0.75rem', borderRadius: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#FFAB00', marginTop: 1, flexShrink: 0 }}>warning</span>
              <div>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#FFAB00', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 3 }}>Conflicting Sources</span>
                <span style={{ fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc' }}>{conflictNote}</span>
              </div>
            </div>
          )}
          {temporallySensitive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(85,96,112,0.08)', border: '1px solid rgba(85,96,112,0.2)', padding: '0.5rem 0.75rem', borderRadius: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#556070' }}>schedule</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase' }}>Time-sensitive — evidence may be outdated</span>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: 4 }}>
            <button onClick={() => setExpanded(!expanded)} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Mono', fontSize: 10,
              color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.05em',
              padding: 0, transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#e3e2e8'}
              onMouseLeave={e => e.currentTarget.style.color = '#bac9cc'}
            >
              View Reasoning
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {expanded ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {citations?.length > 0 && (
              <button onClick={() => onViewSources(citations)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'IBM Plex Mono', fontSize: 10,
                color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.05em',
                padding: 0, textDecoration: 'none',
              }}>
                {citations.length} source{citations.length > 1 ? 's' : ''} →
              </button>
            )}
          </div>
        </div>

        {/* Side icon */}
        <div style={{ width: 80, height: 64, backgroundColor: '#1f1f24', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start', borderRadius: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'rgba(59,73,76,0.8)' }}>{cfg.icon}</span>
        </div>
      </div>

      {/* Reasoning accordion */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(59,73,76,0.3)' }}
          >
            <div style={{ padding: '1.25rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.3)' }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#556070', display: 'block', marginBottom: 10 }}>
                Chain of Thought
              </span>
              <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {reasoning}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
