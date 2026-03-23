import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function URLImageAnalysisPanel({ images, domain }) {
  const [expanded, setExpanded] = useState(true);

  if (!images || images.length === 0) return null;

  const aiCount     = images.filter(img => (img.aiProbability || 0) > 0.7).length;
  const mixedCount  = images.filter(img => { const p = img.aiProbability || 0; return p > 0.4 && p <= 0.7; }).length;
  const realCount   = images.filter(img => (img.aiProbability || 0) <= 0.4).length;
  const overallRisk = aiCount > 0 ? 'AI Detected' : mixedCount > 0 ? 'Uncertain' : 'Authentic';
  const riskColor   = aiCount > 0 ? '#FF3D57' : mixedCount > 0 ? '#FFAB00' : '#00E5FF';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        backgroundColor: '#161820',
        borderBottom: `1px solid ${riskColor}20`,
        borderLeft: `1px solid ${riskColor}20`,
        borderRight: `1px solid ${riskColor}20`,
        borderTop: `2px solid ${riskColor}`,
        borderRadius: 12, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.9rem 1.25rem',
        borderBottom: expanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: riskColor, fontVariationSettings: "'FILL' 1" }}>
            image_search
          </span>
          <div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#e3e2e8' }}>
              Embedded Image Analysis
            </span>
            {domain && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', marginLeft: 8 }}>
                from {domain}
              </span>
            )}
          </div>
          {/* Overall verdict badge */}
          <span style={{
            fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700,
            padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase',
            color: riskColor, backgroundColor: `${riskColor}12`,
            border: `1px solid ${riskColor}30`, letterSpacing: '0.08em',
          }}>
            {overallRisk}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 8 }}>
            {aiCount > 0 && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#FF3D57' }}>
                {aiCount} AI
              </span>
            )}
            {mixedCount > 0 && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#FFAB00' }}>
                {mixedCount} Uncertain
              </span>
            )}
            {realCount > 0 && (
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF' }}>
                {realCount} Authentic
              </span>
            )}
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#556070', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </div>

      {/* Image cards */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {images.map((img, i) => {
                const pct   = Math.round((img.aiProbability || 0) * 100);
                const color = pct > 70 ? '#FF3D57' : pct > 40 ? '#FFAB00' : '#00E5FF';
                const label = pct > 70 ? 'AI Generated' : pct > 40 ? 'Uncertain' : 'Likely Authentic';
                const icon  = pct > 70 ? 'warning' : pct > 40 ? 'help' : 'verified';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '120px 1fr',
                      gap: '1rem',
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      borderTop: `1px solid ${color}20`,
                      borderBottom: `1px solid ${color}20`,
                      borderRight: `1px solid ${color}20`,
                      borderLeft: `3px solid ${color}`,
                      borderRadius: 8, overflow: 'hidden',
                    }}
                  >
                    {/* Image preview */}
                    <div style={{ backgroundColor: '#0d0e12', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}>
                      <img
                        src={img.imageUrl}
                        alt={img.alt || `Image ${i + 1}`}
                        style={{ width: '100%', height: 90, objectFit: 'cover', display: 'block' }}
                        onError={e => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = `<span class="material-symbols-outlined" style="font-size:28px;color:#556070">broken_image</span>`;
                        }}
                      />
                    </div>

                    {/* Analysis */}
                    <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {/* Verdict row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 15, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {label}
                          </span>
                        </div>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700, color }}>
                          {pct}% AI
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          style={{ height: '100%', backgroundColor: color, borderRadius: 2 }}
                        />
                      </div>

                      {/* Explanation */}
                      {img.explanation && (
                        <p style={{ fontFamily: 'Manrope', fontSize: 11, color: '#8892a4', lineHeight: 1.5, margin: 0,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {img.explanation}
                        </p>
                      )}

                      {/* Signals */}
                      {img.signals?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {img.signals.slice(0, 3).map((s, j) => (
                            <span key={j} style={{
                              fontFamily: 'IBM Plex Mono', fontSize: 8, textTransform: 'uppercase',
                              padding: '1px 6px', borderRadius: 999,
                              color, backgroundColor: `${color}08`, border: `1px solid ${color}20`,
                            }}>{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Bonus module label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: 4 }}>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', border: '1px solid rgba(85,96,112,0.3)', padding: '2px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Bonus Module · AI Media Detection
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
