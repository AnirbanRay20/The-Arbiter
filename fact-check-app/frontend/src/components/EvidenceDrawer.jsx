import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const EvidenceDrawer = ({ citations, onClose }) => {
  const [search, setSearch] = useState('');
  const isOpen = citations && citations.length > 0;

  const filtered = citations?.filter(c =>
    !search ||
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    (c.snippet || c.relevantSnippet || '').toLowerCase().includes(search.toLowerCase())
  ) || [];

  // Credibility color based on score
  const credColor = (score) => {
    if (!score) return '#556070';
    if (score > 0.7) return '#00E5FF';
    if (score > 0.4) return '#FFAB00';
    return '#FF3D57';
  };

  const credLabel = (score) => {
    if (!score) return 'Unknown';
    if (score > 0.7) return 'High';
    if (score > 0.4) return 'Medium';
    return 'Low';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 40,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: 420,
              backgroundColor: '#0d0e12',
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              zIndex: 50,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              padding: '1rem 1.25rem 0.75rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(13,14,18,0.95)',
              backdropFilter: 'blur(12px)',
              flexShrink: 0,
            }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 6,
                    backgroundColor: 'rgba(0,229,255,0.1)',
                    border: '1px solid rgba(0,229,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF' }}>shield</span>
                  </div>
                  <div>
                    <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 14, color: '#e3e2e8', margin: 0 }}>
                      Evidence Sources
                    </p>
                    <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '2px 0 0' }}>
                      {citations.length} source{citations.length !== 1 ? 's' : ''} retrieved
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    width: 30, height: 30, borderRadius: 6,
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#556070', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,61,87,0.1)'; e.currentTarget.style.color = '#FF3D57'; e.currentTarget.style.borderColor = 'rgba(255,61,87,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#556070'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>

              {/* Search bar */}
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 15, color: '#556070', pointerEvents: 'none',
                }}>
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search sources..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', backgroundColor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6,
                    padding: '0.5rem 0.75rem 0.5rem 2rem',
                    fontFamily: 'Manrope', fontSize: 12, color: '#e3e2e8',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.06)'}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#556070',
                    display: 'flex', alignItems: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── Source list ── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
              {filtered.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#556070' }}>search_off</span>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    No sources match
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {filtered.map((cite, i) => {
                    let hostname = '';
                    try { hostname = new URL(cite.url).hostname.replace('www.', ''); } catch {}
                    const score  = cite.credibilityScore || cite.score;
                    const color  = credColor(score);
                    const label  = credLabel(score);
                    const snippet = cite.snippet || cite.relevantSnippet || '';

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          backgroundColor: '#161820',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: 8,
                          overflow: 'hidden',
                          transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                      >
                        {/* Card top accent */}
                        <div style={{ height: 2, backgroundColor: color, opacity: 0.6 }} />

                        <div style={{ padding: '0.9rem 1rem' }}>

                          {/* Source meta row */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {/* Source number */}
                              <span style={{
                                width: 20, height: 20, borderRadius: '50%',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', flexShrink: 0,
                              }}>
                                {i + 1}
                              </span>
                              {/* Domain */}
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', letterSpacing: '0.05em' }}>
                                {hostname}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {/* Credibility badge */}
                              {score && (
                                <span style={{
                                  fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700,
                                  padding: '2px 7px', borderRadius: 999, textTransform: 'uppercase',
                                  color, backgroundColor: `${color}12`,
                                  border: `1px solid ${color}30`,
                                  letterSpacing: '0.06em',
                                }}>
                                  {label}
                                </span>
                              )}
                              {/* Open link */}
                              <a
                                href={cite.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  width: 26, height: 26, borderRadius: 5,
                                  backgroundColor: 'rgba(0,229,255,0.08)',
                                  border: '1px solid rgba(0,229,255,0.2)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#00E5FF', transition: 'all 0.15s', textDecoration: 'none',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.18)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.08)'; }}
                                title="Open source"
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>open_in_new</span>
                              </a>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 style={{
                            fontFamily: 'Manrope', fontWeight: 600, fontSize: 13,
                            color: '#e3e2e8', lineHeight: 1.4, margin: '0 0 0.5rem',
                          }}>
                            {cite.title || 'Untitled Source'}
                          </h4>

                          {/* Snippet */}
                          {snippet && (
                            <div style={{
                              borderLeft: `2px solid ${color}40`,
                              paddingLeft: '0.6rem', marginTop: '0.5rem',
                            }}>
                              <p style={{
                                fontFamily: 'Manrope', fontSize: 12,
                                color: '#8892a4', lineHeight: 1.6,
                                margin: 0, fontStyle: 'italic',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}>
                                "{snippet}"
                              </p>
                            </div>
                          )}

                          {/* Relevance bar */}
                          {score && (
                            <div style={{ marginTop: '0.6rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  Relevance
                                </span>
                                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color, fontWeight: 700 }}>
                                  {Math.round(score * 100)}%
                                </span>
                              </div>
                              <div style={{ height: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${score * 100}%` }}
                                  transition={{ duration: 0.6, delay: i * 0.05 }}
                                  style={{ height: '100%', backgroundColor: color, borderRadius: 1 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: 'rgba(0,0,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {filtered.length} of {citations.length} shown
              </span>
              <button
                onClick={onClose}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0.4rem 0.9rem', borderRadius: 6,
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#bac9cc', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#e3e2e8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#bac9cc'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
