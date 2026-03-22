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

  // Safe tracking: Whenever a report successfully completes, log it.
  React.useEffect(() => {
    if (report && !isProcessing && lastQueryContext) {
      const prev = JSON.parse(localStorage.getItem('arbiter_history') || '[]');
      const newEntry = {
        id: Date.now(),
        q: lastQueryContext,
        risk: report.riskLevel,
        acc: report.accuracyScore,
        date: new Date().toISOString()
      };
      
      // avoid dupes by time
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
    const queryMatch = text.includes(searchQuery.toLowerCase());
    if (!queryMatch) return false;
    
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Tech') return text.includes('tech') || text.includes('software') || text.includes('ai') || text.includes('app') || text.includes('digital') || text.includes('data');
    if (activeCategory === 'Science') return text.includes('science') || text.includes('research') || text.includes('study') || text.includes('physics') || text.includes('medical') || text.includes('health');
    if (activeCategory === 'Business') return text.includes('business') || text.includes('market') || text.includes('company') || text.includes('finance') || text.includes('stock') || text.includes('economy');
    return true;
  });

  const visibleClaims = filteredClaims.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#121317' }}>

      {/* ── Sidebar ── */}
      <Sidebar activeView={activeView} onNavigate={setActiveView} onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }} />

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0d0e12' }}>
        <TopBar isProcessing={isProcessing} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="max-w-5xl mx-auto px-6 py-10 pb-32">

            {/* Active View Router */}
            <AnimatePresence mode="wait">
              {activeView === 'history' && (
                <HistoryView 
                  key="history" 
                  onSelect={(query) => {
                    setActiveView('dashboard');
                    setInitialContent(query);
                    handleFactCheck('text', query);
                  }} 
                />
              )}

              {activeView === 'suggestions' && (
                <SuggestionsView key="suggestions" onSelect={(text) => {
                  setInitialContent(text);
                  setActiveView('dashboard');
                }} />
              )}

              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Pipeline progress (shown while processing) */}
                  {pipelineState && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
                      <PipelineProgress
                        currentStep={pipelineState.step}
                        status={pipelineState.status}
                        progress={pipelineState.progress}
                      />
                    </motion.div>
                  )}

                  {/* Pending Claims Preview */}
                  {isProcessing && claims.length > 0 && claims.length > processedClaims.length && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '2rem', backgroundColor: '#161820', padding: '1.5rem', borderRadius: 8, border: '1px solid rgba(59,73,76,0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: 18, color: '#00E5FF' }}>autorenew</span>
                        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          📌 Extracted Claims & Processing ({processedClaims.length}/{claims.length})
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {claims.filter(c => !processedClaims.find(pc => pc.id === c.id)).map(c => (
                          <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                            <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 16, color: '#556070', marginTop: 2 }}>search</span>
                            <p style={{ fontFamily: 'Manrope', fontSize: 14, color: '#bac9cc', margin: 0 }}>"{c.claim}"</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <div style={{ padding: '1rem', backgroundColor: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57', fontFamily: 'IBM Plex Mono', fontSize: 13, textAlign: 'center', marginBottom: '2rem', borderRadius: 4 }}>
                      {error.includes('No factual claims') || error.includes('not a factual claim') 
                        ? "No strong factual claims detected — analyzing input anyway..."
                        : `Process Failed: ${error}`}
                      <button onClick={reset} style={{ display: 'block', margin: '0.75rem auto 0', padding: '0.5rem 1rem', background: 'rgba(255,61,87,0.2)', color: '#FF3D57', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Start Over
                      </button>
                    </div>
                  )}

                  {/* Claims feed & Results Dashboard */}
                  {processedClaims.length > 0 && (
                    <div className="space-y-8" style={{ marginTop: report ? '2.5rem' : 0 }}>
                      {/* Hero AI Detection Section (if exists) */}
                      {report && aiDetection && (
                        <div className="mb-12">
                          <AIDetectionPanel detectionResult={aiDetection} />
                        </div>
                      )}

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                          Forensic Intelligence Dashboard
                        </span>
                        {isProcessing && (
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                            Real-time Stream
                          </span>
                        )}
                      </div>

                      {/* Full Width Accuracy Summary Card */}
                      {report && (
                        <div className="bg-[#161820] rounded-2xl border border-white/5 overflow-hidden shadow-2xl mb-8">
                          <AccuracyReport report={report} />
                        </div>
                      )}

                      {/* Toolbar: Actions + Context */}
                      {report && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10 bg-[#161820] p-4 rounded-xl border border-white/5">
                          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider text-gray-400">
                             <span><b className="text-gray-200">{claims.length}</b> Claims Analyzed</span>
                             <span className="w-1 h-1 rounded-full bg-white/20"></span>
                             <span className="text-green-400">Verified</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                             <button 
                               onClick={() => { navigator.clipboard.writeText(JSON.stringify(report, null, 2)); alert('Copied to clipboard!') }} 
                               className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-gray-300 flex items-center gap-2"
                             >
                               <span className="material-symbols-outlined text-[16px]">content_copy</span> Copy
                             </button>
                             <button 
                               onClick={() => {
                                 const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                                 const url  = URL.createObjectURL(blob);
                                 const a    = document.createElement('a');
                                 a.href = url; a.download = 'arbiter_report.json'; a.click();
                                 URL.revokeObjectURL(url);
                               }} 
                               className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors text-gray-300 flex items-center gap-2"
                             >
                               <span className="material-symbols-outlined text-[16px]">download</span> Download
                             </button>
                             <button 
                               onClick={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }} 
                               className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-[#00363d] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(0,229,255,0.3)] flex items-center gap-2"
                             >
                               <span className="material-symbols-outlined text-[16px]">refresh</span> New Check
                             </button>
                          </div>
                        </div>
                      )}

                      {/* Filters & Search */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                         <div className="flex bg-[#161820] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                           {filterCategories.map(cat => (
                             <button 
                               key={cat} 
                               onClick={() => setActiveCategory(cat)}
                               className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                             >
                               {cat}
                             </button>
                           ))}
                         </div>
                         <div className="relative w-full md:w-72 shrink-0">
                           <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">search</span>
                           <input 
                             type="text" 
                             placeholder="Search..." 
                             value={searchQuery}
                             onChange={(e) => setSearchQuery(e.target.value)}
                             className="w-full bg-[#161820] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                           />
                         </div>
                      </div>

                      {/* Claims Grid Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                        <AnimatePresence>
                          {visibleClaims.map((c) => (
                            <ClaimCard 
                              key={c.id} 
                              claimData={c}
                              onViewSources={(citations) => setActiveSources(citations)} 
                            />
                          ))}
                        </AnimatePresence>
                      </div>

                      {isProcessing && claims.length > processedClaims.length && (
                        <p className="text-center py-6 font-mono text-[10px] text-cyan-400 uppercase tracking-widest animate-pulse">
                          Processing {claims.length - processedClaims.length} remaining claims...
                        </p>
                      )}

                      {/* Show More Button */}
                      {!isProcessing && visibleCount < filteredClaims.length && (
                        <div className="flex justify-center mt-10">
                          <button 
                            onClick={() => setVisibleCount(v => v + 6)}
                            className="px-8 py-3 bg-[#161820] border border-white/5 hover:border-white/10 hover:bg-[#1a1c25] rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 transition-all flex items-center gap-2 group"
                          >
                            Load More Results
                            <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                          </button>
                        </div>
                      )}
                      
                      {!isProcessing && filteredClaims.length === 0 && processedClaims.length > 0 && (
                        <div className="text-center py-10">
                          <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No claims match your filters.</p>
                        </div>
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

      {/* Evidence Drawer */}
      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />
    </div>
  );
}
