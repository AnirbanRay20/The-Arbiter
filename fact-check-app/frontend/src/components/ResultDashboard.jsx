import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AccuracyReport from './AccuracyReport';
import ClaimCard from './ClaimCard';
import { AIDetectionPanel } from './AIDetectionPanel';
import CorrectAnswerPanel from './CorrectAnswerPanel';

export default function ResultDashboard({
  lastQueryContext,
  report,
  aiDetection,
  isProcessing,
  processedClaims = [],
  claims = [],
  chatId,
  onNewCheck,
  setToast,
  setActiveSources
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);

  const filterCategories = ['All', 'Tech', 'Science', 'Business'];

  const filteredClaims = processedClaims.filter(c => {
    const text = (c.claim + ' ' + (c.reasoning || '')).toLowerCase();
    if (!text.includes(searchQuery.toLowerCase())) return false;
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Tech') return text.includes('tech') || text.includes('software') || text.includes('ai') || text.includes('digital') || text.includes('data');
    if (activeCategory === 'Science') return text.includes('science') || text.includes('research') || text.includes('study') || text.includes('physics') || text.includes('medical') || text.includes('health');
    if (activeCategory === 'Business') return text.includes('business') || text.includes('market') || text.includes('company') || text.includes('finance') || text.includes('stock');
    return true;
  });

  const visibleClaims = filteredClaims.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── FACT ASKED HEADER ── */}
      {lastQueryContext && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '1rem 1.25rem',
            backgroundColor: '#161820',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: '3px solid #00E5FF',
            borderRadius: 8,
          }}
        >
          {/* Icon */}
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', marginTop: 2, flexShrink: 0 }}>fact_check</span>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#556070', display: 'block', marginBottom: 6 }}>
              Fact Asked
            </span>
            <p style={{
              fontFamily: 'Manrope', fontWeight: 500, fontSize: 14,
              color: '#e3e2e8', lineHeight: 1.5, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              "{lastQueryContext}"
            </p>
          </div>

          {/* Timestamp */}
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', flexShrink: 0, alignSelf: 'center' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>
      )}

      {/* STEP 2 — Session Intelligence Report */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            backgroundColor: '#161820',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <AccuracyReport
              report={report}
              onNewCheck={onNewCheck}
              onShare={chatId ? () => { navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`); setToast('Link copied successfully'); setTimeout(() => setToast(null), 3000); } : null}
            />
          </div>
        </motion.div>
      )}

      {/* STEP 3 — AI Detection Panel */}
      {report && aiDetection && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AIDetectionPanel detectionResult={aiDetection} />
        </motion.div>
      )}

      {/* STEP 4 — Correct Answers Panel (for False/Partial claims) */}
      {report && processedClaims.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CorrectAnswerPanel processedClaims={processedClaims} />
        </motion.div>
      )}

      {/* STEP 5 — Verified Claims Feed */}
      {processedClaims.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
              Verified Claims Stream
            </span>
            {isProcessing && (
              <span className="animate-pulse" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Live Stream
              </span>
            )}
          </div>

          {/* Filters + Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#161820', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', gap: 2 }}>
              {filterCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  padding: '0.35rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  backgroundColor: activeCategory === cat ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeCategory === cat ? '#e3e2e8' : '#556070',
                  transition: 'all 0.15s',
                }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', width: 220 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#556070' }}>search</span>
              <input
                type="text" placeholder="Search claims..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: '#161820', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.45rem 0.75rem 0.45rem 2rem', fontFamily: 'Manrope', fontSize: 12, color: '#e3e2e8', outline: 'none' }}
              />
            </div>
          </div>

          {/* Claims grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
            <AnimatePresence>
              {visibleClaims.map(c => (
                <ClaimCard key={c.id} claimData={c} onViewSources={citations => setActiveSources(citations)} />
              ))}
            </AnimatePresence>
          </div>

          {/* Processing indicator */}
          {isProcessing && claims.length > processedClaims.length && (
            <p className="animate-pulse" style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '1.5rem 0' }}>
              Processing {claims.length - processedClaims.length} remaining claims...
            </p>
          )}

          {/* Load more */}
          {!isProcessing && visibleCount < filteredClaims.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => setVisibleCount(v => v + 6)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.6rem 1.75rem', backgroundColor: '#161820',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
                color: '#bac9cc', cursor: 'pointer',
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Load More
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
              </button>
            </div>
          )}

          {/* No results */}
          {!isProcessing && filteredClaims.length === 0 && processedClaims.length > 0 && (
            <p style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', padding: '2rem 0' }}>
              No claims match your filters.
            </p>
          )}

        </motion.div>
      )}
    </div>
  );
}
