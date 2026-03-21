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
import { useFactCheck } from './hooks/useFactCheck';
import { detectAIText } from './services/api';

export default function App() {
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
    if (inputType === 'text') {
      try { setAiDetection(await detectAIText(content)); }
      catch (e) { console.error(e); }
    }
    startFactCheck(inputType, content);
  };

  const showResults = pipelineState || report || processedClaims.length > 0;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#121317' }}>

      {/* ── Sidebar ── */}
      <Sidebar onNewCheck={reset} />

      {/* ── Main ── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0d0e12' }}>
        <TopBar isProcessing={isProcessing} />

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem 1.5rem 6rem' }}>

            {/* Pipeline progress (shown while processing) */}
            {pipelineState && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: '2rem' }}>
                <PipelineProgress
                  currentStep={pipelineState.step}
                  status={pipelineState.status}
                  progress={pipelineState.progress}
                />
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57', fontFamily: 'IBM Plex Mono', fontSize: 13, textAlign: 'center', marginBottom: '2rem', borderRadius: 4 }}>
                Process Failed: {error}
                <button onClick={reset} style={{ display: 'block', margin: '0.75rem auto 0', padding: '0.5rem 1rem', background: 'rgba(255,61,87,0.2)', color: '#FF3D57', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Mono', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Start Over
                </button>
              </div>
            )}

            {/* Accuracy report */}
            {report && <AccuracyReport report={report} />}

            {/* Claims feed */}
            {processedClaims.length > 0 && (
              <div style={{ marginTop: report ? '2rem' : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(59,73,76,0.3)' }}>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(186,201,204,0.6)' }}>
                    Verified Claims Stream
                  </span>
                  {isProcessing && (
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      className="animate-pulse">
                      Live Updates Active
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <AnimatePresence>
                    {processedClaims.map((c) => (
                      <ClaimCard key={c.id} claimData={c}
                        onViewSources={(citations) => setActiveSources(citations)} />
                    ))}
                  </AnimatePresence>
                </div>
                {isProcessing && claims.length > processedClaims.length && (
                  <p style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '2rem 0' }}
                    className="animate-pulse">
                    Processing {claims.length - processedClaims.length} remaining claims...
                  </p>
                )}
              </div>
            )}

            {/* Empty state */}
            {!showResults && !error && (
              <EmptyState onSubmit={handleFactCheck} disabled={isProcessing} />
            )}

            {/* AI Detection */}
            {report && aiDetection && (
              <div style={{ marginTop: '2rem' }}>
                <AIDetectionPanel detectionResult={aiDetection} />
                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <button onClick={reset} style={{ padding: '0.75rem 2rem', background: 'rgba(255,255,255,0.05)', color: '#e3e2e8', border: '1px solid rgba(59,73,76,0.5)', cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em', borderRadius: 999 }}>
                    Start New Fact Check
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Evidence Drawer */}
      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />
    </div>
  );
}
