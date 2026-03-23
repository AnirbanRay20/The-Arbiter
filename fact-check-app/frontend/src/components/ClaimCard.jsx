import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VERDICT_CFG = {
  'True':           { color: '#00E5FF', bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.2)',  bar: '#00E5FF', icon: 'check_circle'  },
  'False':          { color: '#FF3D57', bg: 'rgba(255,61,87,0.08)',  border: 'rgba(255,61,87,0.2)',  bar: '#FF3D57', icon: 'cancel'         },
  'Partially True': { color: '#FFAB00', bg: 'rgba(255,171,0,0.08)',  border: 'rgba(255,171,0,0.2)',  bar: '#FFAB00', icon: 'balance'        },
  'Unverifiable':   { color: '#556070', bg: 'rgba(85,96,112,0.06)', border: 'rgba(85,96,112,0.15)', bar: '#556070', icon: 'help'           },
  'ERROR':          { color: '#FF3D57', bg: 'rgba(255,61,87,0.08)', border: 'rgba(255,61,87,0.2)', bar: '#FF3D57', icon: 'error'          },
};


// Extract direct answer from reasoning if it starts with "ANSWER:"
const extractAnswer = (reasoning, directAnswer) => {
  if (directAnswer) return directAnswer;
  if (!reasoning) return null;
  if (reasoning.startsWith('ANSWER:')) {
    const firstSentence = reasoning.slice(7).split(/[.!?]/)[0].trim();
    return firstSentence;
  }
  return null;
};

// Strip "ANSWER: ..." prefix from reasoning for display
const cleanReasoning = (reasoning) => {
  if (!reasoning) return '';
  if (reasoning.startsWith('ANSWER:')) {
    const dotIdx = reasoning.indexOf('.');
    return dotIdx !== -1 ? reasoning.slice(dotIdx + 1).trim() : reasoning;
  }
  return reasoning;
};

export default function ClaimCard({ claimData, onViewSources }) {
  const [expanded, setExpanded] = useState(false);
  const {
    claim, verdict, confidenceScore, reasoning, citations,
    conflictingEvidence, conflictNote, temporallySensitive,
    id, isQuestion, directAnswer
  } = claimData;

  const cfg = VERDICT_CFG[verdict] || VERDICT_CFG['Unverifiable'];
  const pct = Math.round((confidenceScore || 0) * 100);
  const isError = reasoning === 'Error during verification process.' || !reasoning;
  const answer  = extractAnswer(reasoning, directAnswer);
  const cleanedReasoning = cleanReasoning(reasoning);
  const reasoningPreview = cleanedReasoning ? cleanedReasoning.split('.')[0] + '.' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'relative', backgroundColor: '#161820',
        border: `1px solid ${cfg.border}`, borderRadius: 10,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      whileHover={{ boxShadow: `0 4px 24px ${cfg.bg}` }}
    >
      {/* Thin top accent bar */}
      <div style={{ height: 2, width: '100%', backgroundColor: cfg.bar, flexShrink: 0 }} />

      <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>

        {/* Row 1: Verdict badge + Confidence */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Question badge */}
            {isQuestion && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700,
                padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
                color: '#FFAB00', backgroundColor: 'rgba(255,171,0,0.08)',
                border: '1px solid rgba(255,171,0,0.2)', letterSpacing: '0.08em',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>quiz</span>
                Question
              </span>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: cfg.color, fontVariationSettings: "'FILL' 1" }}>
              {cfg.icon}
            </span>
            <span style={{
              fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: 10,
              padding: '3px 9px', borderRadius: 999,
              color: cfg.color, backgroundColor: cfg.bg,
              border: `1px solid ${cfg.border}`,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {verdict}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: pct > 0 ? cfg.color : '#556070', opacity: 0.8 }}>
              {pct}% Confidence
            </span>
            {id && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: 'rgba(85,96,112,0.5)', border: '1px solid rgba(85,96,112,0.2)', padding: '1px 6px', borderRadius: 3 }}>
                {id}
              </span>
            )}
          </div>
        </div>

        {/* Confidence bar */}
        <div style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', backgroundColor: cfg.color, borderRadius: 1 }}
          />
        </div>

        {/* Original question/claim */}
        <h3 style={{
          fontFamily: 'Manrope', fontWeight: 600, fontSize: 15,
          color: isQuestion ? '#bac9cc' : '#e3e2e8',
          lineHeight: 1.5, margin: 0,
          fontStyle: isQuestion ? 'italic' : 'normal',
        }}>
          {isQuestion ? '❓ ' : '"'}{claim}{isQuestion ? '' : '"'}
        </h3>

        {/* ── DIRECT ANSWER BOX (only for questions) ── */}
        {isQuestion && answer && !isError && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              backgroundColor: 'rgba(0,229,255,0.06)',
              border: '1px solid rgba(0,229,255,0.2)',
              borderLeft: '3px solid #00E5FF',
              borderRadius: 8, padding: '0.75rem 1rem',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', flexShrink: 0, marginTop: 1, fontVariationSettings: "'FILL' 1" }}>
              lightbulb
            </span>
            <div>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 4 }}>
                Answer
              </span>
              <p style={{ fontFamily: 'Manrope', fontWeight: 600, fontSize: 14, color: '#e3e2e8', margin: 0, lineHeight: 1.5 }}>
                {answer}
              </p>
            </div>
          </motion.div>
        )}

        {/* Reasoning preview OR error state */}
        {isError ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.5rem 0.75rem', backgroundColor: 'rgba(85,96,112,0.08)',
            border: '1px solid rgba(85,96,112,0.15)', borderRadius: 6,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070' }}>warning</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Search timed out — could not verify
            </span>
          </div>
        ) : !isQuestion && (
          <p style={{
            fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc',
            margin: 0, lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {reasoningPreview}
          </p>
        )}

        {/* Flags */}
        {conflictingEvidence && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, backgroundColor: 'rgba(255,171,0,0.06)', border: '1px solid rgba(255,171,0,0.2)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#FFAB00', flexShrink: 0, marginTop: 1 }}>warning</span>
            <div>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#FFAB00', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: 2 }}>Conflicting Sources</span>
              <span style={{ fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc' }}>{conflictNote}</span>
            </div>
          </div>
        )}

        {temporallySensitive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(85,96,112,0.06)', border: '1px solid rgba(85,96,112,0.15)', borderRadius: 6, padding: '0.5rem 0.75rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070' }}>schedule</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Time-sensitive — evidence may be outdated</span>
          </div>
        )}

        {/* Verified timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#556070' }}>verified</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', letterSpacing: '0.08em' }}>
            Verified as of {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: 'auto',
        }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Mono', fontSize: 10,
              color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: 0, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#bac9cc'}
            onMouseLeave={e => e.currentTarget.style.color = '#556070'}
          >
            {expanded ? 'Hide' : 'View'} Analysis
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {citations?.length > 0 && (
            <button
              onClick={() => onViewSources(citations)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'IBM Plex Mono', fontSize: 10,
                color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: 0, transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(0,229,255,0.7)'}
              onMouseLeave={e => e.currentTarget.style.color = '#00E5FF'}
            >
              {citations.length} Source{citations.length !== 1 ? 's' : ''}
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded reasoning */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div style={{ padding: '1rem 1.25rem', backgroundColor: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {isQuestion ? 'Full Analysis' : 'Full AI Reasoning'}
              </span>
              <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                {cleanedReasoning || 'No reasoning available.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
