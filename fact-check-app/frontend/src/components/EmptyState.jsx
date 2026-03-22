import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageAnalysisPanel from './ImageAnalysisPanel';
import { analyzeImageFile, analyzeImageUrl } from '../services/api';

const PLACEHOLDERS = [
  'Paste any claim, news, or URL to verify...',
  'Try: "The Earth is flat"',
  'Try: "Tesla was founded in 2005"',
  'Try: "AI will replace all jobs"',
];

const CHIPS = [
  { label: '🌍 The Earth is flat',       value: 'The Earth is flat' },
  { label: '⚡ Tesla founded in 2005',    value: 'Tesla was founded in 2005' },
  { label: '🤖 AI will replace all jobs', value: 'AI will replace all jobs' },
];

const TABS = [
  { id: 'text',  icon: 'description',  label: 'Text'  },
  { id: 'url',   icon: 'link',         label: 'URL'   },
  { id: 'image', icon: 'image_search', label: 'Image' },
];

export default function EmptyState({ onSubmit, disabled, initialContent = '' }) {
  const [tab, setTab]                       = useState('text');
  const [content, setContent]               = useState('');
  const [phIdx, setPhIdx]                   = useState(0);
  const [isFocused, setIsFocused]           = useState(false);
  const [isListening, setIsListening]       = useState(false);
  const [imageResult, setImageResult]       = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const recognitionRef  = useRef(null);
  const finalTranscript = useRef('');

  // Speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR && !recognitionRef.current) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.onstart  = () => setIsListening(true);
      rec.onend    = () => setIsListening(false);
      rec.onerror  = (e) => { if (e.error === 'not-allowed') alert('Microphone access denied.'); setIsListening(false); };
      rec.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript.current += t;
          else interim += t;
        }
        setContent(finalTranscript.current + interim);
      };
      recognitionRef.current = rec;
    }
    return () => recognitionRef.current?.stop();
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); }
    else {
      setTab('text');
      finalTranscript.current = content;
      try { recognitionRef.current.start(); } catch (e) { console.error(e); }
    }
  };

  useEffect(() => { if (initialContent) setContent(initialContent); }, [initialContent]);
  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  // Image analysis handler
  const handleImageAnalyze = async ({ type, file, url }) => {
    setIsAnalyzingImage(true);
    setImageResult(null);
    try {
      const result = type === 'file'
        ? await analyzeImageFile(file)
        : await analyzeImageUrl(url);
      setImageResult(result);
    } catch (err) {
      console.error('Image analysis failed:', err);
      setImageResult({
        aiProbability: 0.5, verdict: 'Uncertain', confidence: 0.3,
        signals: ['Analysis failed'],
        explanation: 'Could not analyze image. Please try again.',
        metadata: {},
      });
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  const isUrl     = tab === 'url';
  const isImage   = tab === 'image';
  const validUrl  = isUrl && /^https?:\/\/.+/.test(content);
  const validText = !isUrl && !isImage && content.trim().length > 10;
  const canSubmit = (isUrl ? validUrl : validText) && !disabled;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 'calc(100vh - 56px)',
      padding: '1rem 1.5rem', boxSizing: 'border-box',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 700 }}
      >
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '5px 14px', backgroundColor: '#1f1f24',
          borderRadius: 999, border: '1px solid rgba(0,229,255,0.2)',
          marginBottom: '1.25rem',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#00E5FF', display: 'inline-block' }} />
          <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.18em', color: '#00E5FF', textTransform: 'uppercase' }}>
            AI-Powered Fact Checking
          </span>
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: 'IBM Plex Mono', fontWeight: 700,
          fontSize: 'clamp(1.75rem, 4.5vw, 3rem)',
          color: '#e3e2e8', textAlign: 'center',
          letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '0.6rem',
        }}>
          What do you want<br />to verify today?
        </h2>

        {/* Subtext */}
        <p style={{
          fontFamily: 'Manrope', fontSize: 14, color: '#bac9cc',
          textAlign: 'center', maxWidth: 520, lineHeight: 1.55, marginBottom: '1.75rem',
        }}>
          Paste any article, speech, claim — or upload an image to check if it's AI generated.
        </p>

        {/* ── Input box ── */}
        <div style={{
          width: '100%', backgroundColor: '#161820', borderRadius: 14,
          border: isFocused ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(59,73,76,0.3)',
          boxShadow: isFocused ? '0 4px 32px rgba(0,0,0,0.4), 0 0 24px rgba(0,229,255,0.12)' : '0 4px 24px rgba(0,0,0,0.3)',
          overflow: 'hidden', transition: 'border 0.25s, box-shadow 0.25s',
        }}>

          {/* Input area */}
          <AnimatePresence mode="wait">

            {/* TEXT tab */}
            {tab === 'text' && (
              <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'relative' }}>
                <textarea
                  id="fact-check-input"
                  value={content}
                  onChange={e => {
                    setContent(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 180) + 'px';
                  }}
                  placeholder={PLACEHOLDERS[phIdx]}
                  disabled={disabled}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  rows={3}
                  style={{
                    width: '100%', background: 'transparent', border: 'none', outline: 'none',
                    padding: '1.1rem 3rem 1.1rem 1.25rem', resize: 'none', overflowY: 'auto',
                    fontFamily: 'Manrope', fontSize: 15, color: '#e3e2e8', lineHeight: 1.6,
                    minHeight: 90, maxHeight: 180, boxSizing: 'border-box',
                  }}
                />
                {content.length > 0 && !disabled && (
                  <button onClick={() => setContent('')} style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#bac9cc',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  </button>
                )}
                {recognitionRef.current && !disabled && (
                  <button onClick={toggleListening} style={{
                    position: 'absolute', bottom: 10, right: 10,
                    background: isListening ? '#FF3D57' : 'rgba(255,255,255,0.05)',
                    border: 'none', borderRadius: '50%', width: 32, height: 32,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: isListening ? '#fff' : '#00E5FF',
                    boxShadow: isListening ? '0 0 12px rgba(255,61,87,0.5)' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      {isListening ? 'mic_off' : 'mic'}
                    </span>
                  </button>
                )}
              </motion.div>
            )}

            {/* URL tab */}
            {tab === 'url' && (
              <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', gap: 8 }}
                onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
                <span style={{ fontFamily: 'IBM Plex Mono', color: '#556070', fontSize: 13, flexShrink: 0 }}>https://</span>
                <input
                  type="url" value={content}
                  onChange={e => setContent(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="example.com/article-to-verify"
                  disabled={disabled}
                  style={{
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#e3e2e8',
                  }}
                />
                {content.length > 0 && (
                  <span className="material-symbols-outlined" style={{ color: validUrl ? '#00E5FF' : '#FF3D57', fontSize: 16 }}>
                    {validUrl ? 'check_circle' : 'cancel'}
                  </span>
                )}
              </motion.div>
            )}

            {/* IMAGE tab */}
            {tab === 'image' && (
              <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ padding: '1.25rem' }}>
                <ImageAnalysisPanel
                  onAnalyze={handleImageAnalyze}
                  isAnalyzing={isAnalyzingImage}
                  result={imageResult}
                />
              </motion.div>
            )}

          </AnimatePresence>

          {/* Bottom bar — hide Analyze button on image tab */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.6rem 0.75rem',
            backgroundColor: 'rgba(41,42,46,0.6)',
            borderTop: '1px solid rgba(59,73,76,0.2)',
          }}>
            {/* Tabs */}
            <div style={{
              display: 'flex', gap: 3, padding: 3,
              backgroundColor: '#0d0e12', borderRadius: 7,
              border: '1px solid rgba(59,73,76,0.2)',
            }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setImageResult(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
                    backgroundColor: tab === t.id ? 'rgba(0,229,255,0.1)' : 'transparent',
                    color: tab === t.id ? '#00E5FF' : '#bac9cc',
                    border: 'none', cursor: 'pointer', borderRadius: 5,
                    fontFamily: 'Space Grotesk', fontWeight: 700,
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                    transition: 'all 0.15s',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{t.icon}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Analyze button — hidden on image tab (ImageAnalysisPanel has its own) */}
            {tab !== 'image' && (
              <button
                onClick={() => canSubmit && onSubmit(tab, content)}
                disabled={!canSubmit}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '0.55rem 1.4rem',
                  backgroundColor: canSubmit ? '#00E5FF' : 'rgba(255,255,255,0.04)',
                  color: canSubmit ? '#00363d' : '#556070',
                  border: 'none', borderRadius: 999,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  fontFamily: 'Space Grotesk', fontWeight: 700,
                  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em',
                  boxShadow: canSubmit ? '0 0 18px rgba(0,229,255,0.35)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {disabled ? (
                  <>
                    <span style={{ width: 12, height: 12, border: '2px solid #00363d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze
                    <span className="material-symbols-outlined" style={{ fontSize: 15 }}>arrow_forward</span>
                  </>
                )}
              </button>
            )}

            {/* Image tab indicator */}
            {tab === 'image' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, color: '#556070' }}>info</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Upload or paste image URL to detect AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick-pick chips — hide on image tab */}
        {tab !== 'image' && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            gap: '0.5rem', width: '100%', marginTop: '1rem',
          }}>
            {CHIPS.map(chip => (
              <button
                key={chip.value}
                onClick={() => { if (!disabled) { setTab('text'); setContent(chip.value); }}}
                disabled={disabled}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)', padding: '0.4rem 1rem',
                  borderRadius: 999, border: '1px solid rgba(59,73,76,0.3)',
                  cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                  fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc',
                }}
                onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.4)'; e.currentTarget.style.color = '#00E5FF'; e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.06)'; }}}
                onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(59,73,76,0.3)'; e.currentTarget.style.color = '#bac9cc'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        {/* Pipeline hint */}
        <p style={{
          marginTop: '1.25rem', fontFamily: 'IBM Plex Mono', fontSize: 10,
          color: 'rgba(85,96,112,0.7)', textTransform: 'uppercase',
          letterSpacing: '0.12em', textAlign: 'center',
        }}>
          {tab === 'image'
            ? '// Upload → Analyze → AI Detection Report'
            : '// Extract → Search → Verify → Report'}
        </p>

      </motion.div>
    </div>
  );
}
