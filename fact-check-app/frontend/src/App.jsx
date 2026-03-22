import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import PipelineProgress from './components/PipelineProgress';
import AccuracyReport from './components/AccuracyReport';
import ClaimCard from './components/ClaimCard';
import { AIDetectionPanel } from './components/AIDetectionPanel';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import HistoryView from './components/HistoryView';
import SuggestionsView from './components/SuggestionsView';
import { useFactCheck } from './hooks/useFactCheck';
import { detectAIText } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [initialContent, setInitialContent] = useState('');
  const [lastQueryContext, setLastQueryContext] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);

  const {
    isProcessing, pipelineState, claims,
    processedClaims, report, error,
    startFactCheck, reset
  } = useFactCheck();

  const [aiDetection, setAiDetection]     = useState(null);
  const [activeSources, setActiveSources] = useState([]);

  const handleFactCheck = async (inputType, content) => {
    reset();
    setAiDetection(null);
    setSearchQuery('');
    setActiveCategory('All');
    setVisibleCount(6);
    setLastQueryContext(content);
    if (inputType === 'text') {
      try { setAiDetection(await detectAIText(content)); }
      catch (e) { console.error(e); }
    }
    startFactCheck(inputType, content);
  };

  React.useEffect(() => {
    if (report && !isProcessing && lastQueryContext) {
      const prev = JSON.parse(localStorage.getItem('arbiter_history') || '[]');
      const newEntry = {
        id: Date.now(),
        q: lastQueryContext,
        risk: report.riskLevel,
        acc: report.accuracyScore,
        date: new Date().toISOString(),
        starred: false,
      };
      if (!prev.find(p => p.q === newEntry.q && Math.abs(new Date(p.date) - new Date(newEntry.date)) < 10000)) {
        prev.unshift(newEntry);
        localStorage.setItem('arbiter_history', JSON.stringify(prev));
      }
    }
  }, [report, isProcessing]);

  const showResults = pipelineState || report || processedClaims.length > 0;
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#121317' }}>
      <Sidebar activeView={activeView} onNavigate={setActiveView} onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0d0e12' }}>
        <TopBar isProcessing={isProcessing} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

            <AnimatePresence mode="wait">

              {/* HISTORY */}
              {activeView === 'history' && (
                <HistoryView
                  key="history"
                  onSelect={(query) => { setActiveView('dashboard'); setInitialContent(query); handleFactCheck('text', query); }}
                  onGoToDashboard={() => { reset(); setInitialContent(''); setActiveView('dashboard'); }}
                />
              )}

              {/* SUGGESTIONS */}
              {activeView === 'suggestions' && (
                <SuggestionsView key="suggestions" onSelect={(text) => { setInitialContent(text); setActiveView('dashboard'); }} />
              )}

              {/* DASHBOARD */}
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* ── STEP 1: PIPELINE PROGRESS (always top) ── */}
                  {pipelineState && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                      <PipelineProgress
                        currentStep={pipelineState.step}
                        status={pipelineState.status}
                        progress={pipelineState.progress}
                      />
                    </motion.div>
                  )}

                  {/* Pending claims preview */}
                  {isProcessing && claims.length > 0 && claims.length > processedClaims.length && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ marginBottom: '1.5rem', backgroundColor: '#161820', padding: '1.25rem 1.5rem', borderRadius: 8, border: '1px solid rgba(59,73,76,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 16, color: '#00E5FF' }}>autorenew</span>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Extracted Claims ({processedClaims.length}/{claims.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {claims.filter(c => !processedClaims.find(pc => pc.id === c.id)).map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                            <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 14, color: '#556070' }}>search</span>
                            <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', margin: 0 }}>"{c.claim}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Error */}
                  {error && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)', color: '#FF3D57', fontFamily: 'IBM Plex Mono', fontSize: 12, textAlign: 'center', marginBottom: '1.5rem', borderRadius: 6 }}>
                      {error.includes('No factual claims') ? 'No strong factual claims detected.' : `Process Failed: ${error}`}
                      <button onClick={reset} style={{ display: 'block', margin: '0.6rem auto 0', padding: '0.4rem 1rem', background: 'rgba(255,61,87,0.15)', color: '#FF3D57', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', borderRadius: 4 }}>
                        Start Over
                      </button>
                    </div>
                  )}

                  {/* ── RESULTS SECTION ── */}
                  {(report || processedClaims.length > 0) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                      {/* ── STEP 2: SESSION INTELLIGENCE REPORT ── */}
                      {report && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                          <div style={{
                            backgroundColor: '#161820',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 12,
                            overflow: 'hidden',
                          }}>
                            <AccuracyReport report={report} />

                            {/* Toolbar inside report card */}
                            <div style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '0.75rem 1.5rem',
                              borderTop: '1px solid rgba(255,255,255,0.05)',
                              backgroundColor: 'rgba(0,0,0,0.2)',
                            }}>
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {claims.length} claims analyzed
                              </span>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); alert('Copied!'); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#bac9cc', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span> Copy
                                </button>
                                <button onClick={() => { const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'arbiter_report.json'; a.click(); URL.revokeObjectURL(url); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#bac9cc', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span> Download
                                </button>
                                <button onClick={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0.4rem 0.9rem', backgroundColor: '#00E5FF', border: 'none', color: '#00363d', borderRadius: 6, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 0 12px rgba(0,229,255,0.3)' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span> New Check
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── STEP 3: AI DETECTION PANEL ── */}
                      {report && aiDetection && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                          <AIDetectionPanel detectionResult={aiDetection} />
                        </motion.div>
                      )}

                      {/* ── STEP 4: CLAIMS FEED ── */}
                      {processedClaims.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>

                          {/* Section header */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
                              Verified Claims Stream
                            </span>
                            {isProcessing && (
                              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }} className="animate-pulse">
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
                                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
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
                              <input type="text" placeholder="Search claims..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                style={{ width: '100%', backgroundColor: '#161820', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.45rem 0.75rem 0.45rem 2rem', fontFamily: 'Manrope', fontSize: 12, color: '#e3e2e8', outline: 'none' }} />
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

                          {isProcessing && claims.length > processedClaims.length && (
                            <p style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '1.5rem 0' }} className="animate-pulse">
                              Processing {claims.length - processedClaims.length} remaining claims...
                            </p>
                          )}

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

                          {!isProcessing && filteredClaims.length === 0 && processedClaims.length > 0 && (
                            <p style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', padding: '2rem 0' }}>
                              No claims match your filters.
                            </p>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {!showResults && !error && (
                    <EmptyState onSubmit={handleFactCheck} disabled={isProcessing} initialContent={initialContent} />
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />
    </div>
  );
}
