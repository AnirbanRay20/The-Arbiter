import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import PipelineProgress from './components/PipelineProgress';
import ResultDashboard from './components/ResultDashboard';
import ExplainabilityFlow from './components/ExplainabilityFlow';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import HistoryView from './components/HistoryView';
import SuggestionsView from './components/SuggestionsView';
import SupportView from './components/SupportView';
import { useFactCheck } from './hooks/useFactCheck';
import { detectAIText } from './services/api';
import CorrectAnswerPanel from './components/CorrectAnswerPanel';
import ShareResultView from './components/ShareResultView';
import { buildShareUrl, copyShareLink, isShareLink, buildIdShareUrl, registerShare } from './utils/shareUtils';

export default function App() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isShareView, setIsShareView] = React.useState(() => isShareLink());
  const [initialContent, setInitialContent] = useState('');
  const [lastQueryContext, setLastQueryContext] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(6);

  const {
    isProcessing, pipelineState, claims,
    processedClaims, report, error,
    imageAnalysis, scrapedMeta, shareId,
    startFactCheck, reset
  } = useFactCheck();

  const [aiDetection, setAiDetection] = useState(null);
  const [activeSources, setActiveSources] = useState([]);

  const handleFactCheck = async (inputType, content) => {
    reset();
    setAiDetection(null);
    setSearchQuery('');
    setActiveCategory('All');
    setVisibleCount(6);
    setLastQueryContext(content);
    // Only run AI detection on longer texts (100+ chars) — short questions are not meaningful
    if (inputType === 'text' && content.trim().length > 100) {
      try { setAiDetection(await detectAIText(content)); }
      catch (e) { console.error(e); }
    }
    startFactCheck(inputType, content);
  };

  // Build and copy share link
  const handleShare = React.useCallback(async (query, report, claims, id = null) => {
    // If we have a shareId from the current session, use it
    const sId = (id && id > 100000) ? id : shareId; // history ids are timestamps, backend ids might be different or same
    
    let finalShareId = sId;
    if (!finalShareId) {
      // Register with backend to get a unique ID
      const registered = await registerShare(query, report, claims, id);
      if (registered) finalShareId = registered;
    }

    if (finalShareId) {
      const url = buildIdShareUrl(finalShareId);
      copyShareLink(url);
      return url;
    }

    // Fallback to legacy base64 if backend fails
    const url = buildShareUrl(query, report, claims);
    if (url) {
      copyShareLink(url);
      return url;
    }
    return null;
  }, [shareId]);

  // Save to history on report complete
  React.useEffect(() => {
    if (report && !isProcessing && lastQueryContext) {
      const prev = JSON.parse(localStorage.getItem('arbiter_history') || '[]');
      const newEntry = {
        id:      Date.now(),
        q:       lastQueryContext,
        risk:    report.riskLevel,
        acc:     report.accuracyScore,
        date:    new Date().toISOString(),
        starred: false,
        // Store full data for share links
        report,
        claims:  processedClaims.map(c => ({
          id: c.id, claim: c.claim, verdict: c.verdict,
          confidenceScore: c.confidenceScore, reasoning: c.reasoning,
          conflictingEvidence: c.conflictingEvidence, conflictNote: c.conflictNote,
          temporallySensitive: c.temporallySensitive, isQuestion: c.isQuestion,
          directAnswer: c.directAnswer, citations: (c.citations || []).slice(0, 3),
        })),
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

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }}
      />

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0d0e12' }}>
        <TopBar isProcessing={isProcessing} />

        <div className={activeView === 'history' ? 'no-scrollbar' : 'page-scroll'} style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

            <AnimatePresence mode="wait">

              {/* ── SHARE VIEW ── */}
              {isShareView && (
                <ShareResultView
                  key="share"
                  onGoToDashboard={() => {
                    window.location.hash = '';
                    setIsShareView(false);
                    setActiveView('dashboard');
                  }}
                />
              )}

              {/* ── HISTORY ── */}
              {activeView === 'history' && (
                <HistoryView
                  key="history"
                  onSelect={(query) => { setActiveView('dashboard'); setInitialContent(query); handleFactCheck('text', query); }}
                  onGoToDashboard={() => { reset(); setInitialContent(''); setActiveView('dashboard'); }}
                  onShare={handleShare}
                />
              )}

              {/* ── SUPPORT ── */}
              {activeView === 'support' && (
                <SupportView key="support" />
              )}

              {/* ── SUGGESTIONS ── */}
              {activeView === 'suggestions' && (
                <SuggestionsView
                  key="suggestions"
                  onSelect={(text, type) => { setInitialContent(text); setActiveView('dashboard'); handleFactCheck(type || 'text', text); }}
                />
              )}

              {/* ── DASHBOARD ── */}
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Explainability flow — shown when processing or results exist */}
                  {(pipelineState || report || processedClaims.length > 0) && (
                    <ExplainabilityFlow
                      currentStep={pipelineState?.step || 'REPORTING'}
                      isProcessing={isProcessing}
                    />
                  )}

                  {/* STEP 1 — Pipeline progress */}
                  {pipelineState && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem' }}>
                      <PipelineProgress
                        currentStep={pipelineState.step}
                        status={pipelineState.status}
                        progress={pipelineState.progress}
                      />
                    </motion.div>
                  )}

                  {/* Pending claims preview (while processing) */}
                  {isProcessing && claims.length > 0 && claims.length > processedClaims.length && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ marginBottom: '1.5rem', backgroundColor: '#161820', padding: '1.25rem 1.5rem', borderRadius: 8, border: '1px solid rgba(59,73,76,0.3)' }}
                    >
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

                  {/* ── RESULTS ── */}
                  {(report || processedClaims.length > 0) && (
                    <ResultDashboard
                      lastQueryContext={lastQueryContext}
                      report={report}
                      aiDetection={aiDetection}
                      isProcessing={isProcessing}
                      processedClaims={processedClaims}
                      claims={claims}
                      imageAnalysis={imageAnalysis}
                      scrapedMeta={scrapedMeta}
                      chatId={shareId}
                      onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }}
                      setActiveSources={setActiveSources}
                    />
                  )}

                  {/* Empty state */}
                  {!showResults && !error && (
                    <EmptyState
                      onSubmit={handleFactCheck}
                      disabled={isProcessing}
                      initialContent={initialContent}
                    />
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
