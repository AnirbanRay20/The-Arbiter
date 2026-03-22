import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import EmptyState from './components/EmptyState';
import Layout from './components/Layout';
import PipelineProgress from './components/PipelineProgress';
import AccuracyReport from './components/AccuracyReport';
import ClaimCard from './components/ClaimCard';
import { AIDetectionPanel } from './components/AIDetectionPanel';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import HistoryView from './components/HistoryView';
import SuggestionsView from './components/SuggestionsView';
import SupportView from './components/SupportView';
import { useFactCheck } from './hooks/useFactCheck';
import { detectAIText, saveChat } from './services/api';
import CorrectAnswerPanel from './components/CorrectAnswerPanel';
import ResultDashboard from './components/ResultDashboard';

export default function App() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [initialContent, setInitialContent] = useState('');
  const [lastQueryContext, setLastQueryContext] = useState('');
  
  const [chatId, setChatId] = useState(null);
  const [toast, setToast] = useState(null);

  const {
    isProcessing, pipelineState, claims,
    processedClaims, report, error,
    startFactCheck, reset
  } = useFactCheck();

  const [aiDetection, setAiDetection] = useState(null);
  const [activeSources, setActiveSources] = useState([]);

  const handleFactCheck = async (inputType, content) => {
    reset();
    setAiDetection(null);
    setChatId(null);
    setLastQueryContext(content);
    // Only run AI detection on longer texts (100+ chars) — short questions are not meaningful
    if (inputType === 'text' && content.trim().length > 100) {
      try { setAiDetection(await detectAIText(content)); }
      catch (e) { console.error(e); }
    }
    startFactCheck(inputType, content);
  };

  // Save to history on report complete
  React.useEffect(() => {
    if (report && !isProcessing && lastQueryContext && !chatId) {
      const prev = JSON.parse(localStorage.getItem('arbiter_history') || '[]');
      const id = Date.now().toString();
      const newEntry = {
        id,
        q: lastQueryContext,
        risk: report.riskLevel,
        acc: report.accuracyScore,
        date: new Date().toISOString(),
        starred: false,
      };
      // avoid dupes by time
      const existingEntry = prev.find(p => p.q === newEntry.q && Math.abs(new Date(p.date) - new Date(newEntry.date)) < 10000);
      if (!existingEntry) {
        prev.unshift(newEntry);
        localStorage.setItem('arbiter_history', JSON.stringify(prev));
        
        // Save to key="history" to satisfy requirements
        const standardHistory = JSON.parse(localStorage.getItem('history') || '[]');
        standardHistory.unshift(newEntry);
        localStorage.setItem('history', JSON.stringify(standardHistory));
        
        const chatData = {
          id,
          text: lastQueryContext,
          result: report,
          timestamp: new Date().toISOString(),
          // include old keys so we don't break existing UI
          q: lastQueryContext,
          report,
          claims,
          processedClaims,
          aiDetection
        };
        localStorage.setItem(`chat_${id}`, JSON.stringify(chatData));
        setChatId(id);
        saveChat(chatData).catch(err => console.error("Failed to persist chat:", err));
      } else {
        setChatId(existingEntry.id);
        const chatData = {
          id: existingEntry.id,
          text: lastQueryContext,
          result: report,
          timestamp: new Date().toISOString(),
          q: lastQueryContext,
          report,
          claims,
          processedClaims,
          aiDetection
        };
        localStorage.setItem(`chat_${existingEntry.id}`, JSON.stringify(chatData));
        saveChat(chatData).catch(err => console.error("Failed to persist chat:", err));
      }
    }
  }, [report, isProcessing, lastQueryContext, claims, processedClaims, aiDetection, chatId]);

  const showResults = pipelineState || report || processedClaims.length > 0;

  return (
    <Layout
      activeView={activeView}
      onNavigate={setActiveView}
      onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }}
      isProcessing={isProcessing}
    >
      <AnimatePresence mode="wait">

              {/* ── HISTORY ── */}
              {activeView === 'history' && (
                <HistoryView
                  key="history"
                  onSelect={(item) => navigate(`/chat/${item.id}`)}
                  onGoToDashboard={() => { reset(); setInitialContent(''); setActiveView('dashboard'); }}
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
                  onSelect={(text) => { setInitialContent(text); setActiveView('dashboard'); handleFactCheck('text', text); }}
                />
              )}

              {/* ── DASHBOARD ── */}
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

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
                      key={chatId || lastQueryContext}
                      lastQueryContext={lastQueryContext}
                      report={report}
                      aiDetection={aiDetection}
                      isProcessing={isProcessing}
                      processedClaims={processedClaims}
                      claims={claims}
                      chatId={chatId}
                      onNewCheck={() => { reset(); setActiveView('dashboard'); setInitialContent(''); }}
                      setToast={setToast}
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
          
      {/* Evidence Drawer */}
      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#00E5FF',
              color: '#00363d',
              padding: '12px 24px',
              borderRadius: 999,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 8px 32px rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 1000,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
