import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CorrectAnswerPanel({ processedClaims }) {
  if (!processedClaims || processedClaims.length === 0) return null;

  // Only show for False or Partially True claims that have citations
  const actionableClaims = processedClaims.filter(c =>
    (c.verdict === 'False' || c.verdict === 'Partially True') &&
    c.reasoning && c.citations?.length > 0
  );

  if (actionableClaims.length === 0) return null;

  const verdictColor = (v) => v === 'False' ? '#FF3D57' : '#FFAB00';
  const verdictBg    = (v) => v === 'False' ? 'rgba(255,61,87,0.08)' : 'rgba(255,171,0,0.08)';
  const verdictIcon  = (v) => v === 'False' ? 'cancel' : 'balance';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        backgroundColor: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF' }}>lightbulb</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.7)' }}>
            Correct Answers & Clarifications
          </span>
        </div>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', border: '1px solid rgba(59,73,76,0.4)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {actionableClaims.length} correction{actionableClaims.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Claims */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <AnimatePresence>
          {actionableClaims.map((c, i) => {
            // Extract the correct answer from the reasoning
            // The reasoning contains the evidence-based correct info
            const reasoningLines = c.reasoning?.split('.') || [];
            const correctFact = reasoningLines.slice(0, 2).join('.').trim() + '.';

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                style={{
                  padding: '1.25rem 1.5rem',
                  borderBottom: i < actionableClaims.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderLeft: `3px solid ${verdictColor(c.verdict)}`,
                }}
              >
                {/* Claimed fact */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: '1rem' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 10px', borderRadius: 999,
                    backgroundColor: verdictBg(c.verdict),
                    border: `1px solid ${verdictColor(c.verdict)}30`,
                    flexShrink: 0,
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, color: verdictColor(c.verdict) }}>
                      {verdictIcon(c.verdict)}
                    </span>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, color: verdictColor(c.verdict), textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {c.verdict}
                    </span>
                  </div>
                  <p style={{ fontFamily: 'Manrope', fontSize: 13, color: 'rgba(227,226,232,0.6)', fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                    "{c.claim}"
                  </p>
                </div>

                {/* Correct answer box */}
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  backgroundColor: 'rgba(0,229,255,0.04)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  borderRadius: 8, padding: '0.9rem 1rem',
                  marginBottom: c.citations?.length > 0 ? '0.75rem' : 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF', flexShrink: 0, marginTop: 1 }}>
                    check_circle
                  </span>
                  <div>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', marginBottom: 5 }}>
                      Verified Correct Answer
                    </span>
                    <p style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 14, color: '#e3e2e8', margin: 0, lineHeight: 1.6 }}>
                      {correctFact}
                    </p>
                  </div>
                </div>

                {/* Source links */}
                {c.citations?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', alignSelf: 'center' }}>
                      Sources:
                    </span>
                    {c.citations.slice(0, 3).map((cite, j) => {
                      let hostname = '';
                      try { hostname = new URL(cite.url).hostname.replace('www.', ''); } catch {}
                      return (
                        <a key={j} href={cite.url} target="_blank" rel="noreferrer" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px',
                          backgroundColor: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 999,
                          fontFamily: 'IBM Plex Mono', fontSize: 10,
                          color: '#00E5FF', textDecoration: 'none',
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>link</span>
                          {hostname}
                        </a>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
