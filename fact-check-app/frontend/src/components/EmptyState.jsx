import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDERS = [
  'Paste any claim, news, or URL to verify...',
  'Try: "The Earth is flat"',
  'Try: "Tesla was founded in 2005"',
  'Try: "AI will replace all jobs"',
];

const CHIPS = [
  "The Earth is flat",
  "Tesla was founded in 2005",
  "AI will replace all jobs"
];

export default function EmptyState({ onSubmit, disabled, initialContent = '' }) {
  const [tab, setTab]         = useState('text');
  const [content, setContent] = useState('');
  const [phIdx, setPhIdx]     = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      console.log('Voice: Initializing SpeechRecognition...');
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        console.log('Voice: Recognition started');
        setIsListening(true);
      };

      rec.onresult = (event) => {
        console.log('Voice: result event received', event.results);
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        const fullText = finalTranscriptRef.current + interimTranscript;
        console.log('Voice: Updating UI content:', fullText);
        setContent(fullText);
        
        // Auto-resize
        const textarea = document.getElementById('fact-check-input');
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        }
      };

      rec.onerror = (e) => {
        console.error('Voice: Recognition Error:', e.error, e.message);
        if (e.error === 'not-allowed') {
          alert('Microphone access denied. Please check browser permissions.');
        }
        setIsListening(false);
      };

      rec.onend = () => {
        console.log('Voice: Recognition ended');
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
    
    return () => {
      if (recognitionRef.current) {
        console.log('Voice: Cleaning up recognition');
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      console.warn('Voice: Recognition not supported or initialized');
      return;
    }

    if (isListening) {
      console.log('Voice: Manual stop requested');
      recognitionRef.current.stop();
    } else {
      console.log('Voice: Manual start requested');
      setTab('text');
      // Sync ref with current box content if the user typed manually
      finalTranscriptRef.current = content; 
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Voice: Start failed', err);
      }
    }
  };

  useEffect(() => {
    if (initialContent) setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    const t = setInterval(() => setPhIdx(i => (i + 1) % PLACEHOLDERS.length), 3500);
    return () => clearInterval(t);
  }, []);

  const isUrl     = tab === 'url';
  const validUrl  = isUrl && /^https?:\/\/.+/.test(content);
  const validText = !isUrl && content.trim().length > 10;
  const canSubmit = (isUrl ? validUrl : validText) && !disabled;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      {/* Badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '6px 14px',
        backgroundColor: '#292a2e',
        borderRadius: 999,
        border: '1px solid rgba(59,73,76,0.4)',
        marginBottom: '2rem',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00E5FF', display: 'inline-block' }} />
        <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.15em', color: '#00E5FF', textTransform: 'uppercase' }}>
          AI-Powered Fact Checking
        </span>
      </div>

      {/* Heading */}
      <h2 style={{
        fontFamily: 'IBM Plex Mono', fontWeight: 700,
        fontSize: 'clamp(2rem, 5vw, 3.5rem)',
        color: '#e3e2e8', textAlign: 'center',
        letterSpacing: '-0.02em', lineHeight: 1.1,
        marginBottom: '1rem',
      }}>
        What do you want<br />to verify today?
      </h2>
      <p style={{
        fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: '#00E5FF',
        marginBottom: '1.5rem', textAlign: 'center'
      }}>
        🚀 Start by entering a claim to verify
      </p>

      {/* Subtext */}
      <p style={{
        fontFamily: 'Manrope', fontSize: '1.1rem', color: '#bac9cc',
        textAlign: 'center', maxWidth: 640, lineHeight: 1.6,
        marginBottom: '3rem',
      }}>
        Paste any article, speech, or claim. The Arbiter extracts every fact,
        searches live evidence, and delivers a verdict.
      </p>

      {/* Input box */}
      <div style={{
        width: '100%', maxWidth: 720,
        backgroundColor: '#161820',
        borderRadius: 16,
        border: isFocused ? '1px solid rgba(0,229,255,0.5)' : '1px solid rgba(59,73,76,0.3)',
        transition: 'all 0.3s ease',
        boxShadow: isFocused ? '0 8px 40px rgba(0,0,0,0.4), 0 0 20px rgba(0,229,255,0.15)' : '0 8px 40px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        <AnimatePresence mode="wait">
          {!isUrl ? (
            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative' }}>
              <textarea
                id="fact-check-input"
                value={content}
                onChange={e => {
                  setContent(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = (e.target.scrollHeight) + 'px';
                }}
                placeholder={PLACEHOLDERS[phIdx]}
                disabled={disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                rows={4}
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', outline: 'none',
                  padding: '1.5rem', resize: 'none',
                  fontFamily: 'Manrope', fontSize: '1.1rem',
                  color: '#e3e2e8', lineHeight: 1.6, minHeight: 150, maxHeight: 400, overflowY: 'auto'
                }}
              />
              {content.length > 0 && !disabled && (
                <button onClick={() => { setContent(''); }}
                  style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#bac9cc' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
              {recognitionRef.current && !disabled && (
                <button
                  onClick={toggleListening}
                  style={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    background: isListening ? '#FF3D57' : 'rgba(255,255,255,0.05)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: isListening ? '#fff' : '#00E5FF',
                    transition: 'all 0.2s',
                    boxShadow: isListening ? '0 0 15px rgba(255,61,87,0.4)' : 'none',
                    zIndex: 10
                  }}
                >
                  <span className={`material-symbols-outlined ${isListening ? 'animate-pulse' : ''}`} style={{ fontSize: 20 }}>
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', gap: 8 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', color: '#556070', fontSize: 14 }}>https://</span>
              <input
                type="url"
                value={content}
                onChange={e => setContent(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="example.com/article-to-verify"
                disabled={disabled}
                style={{
                  flex: 1, background: 'transparent',
                  border: 'none', outline: 'none',
                  fontFamily: 'IBM Plex Mono', fontSize: 14,
                  color: '#e3e2e8',
                }}
              />
              {content.length > 0 && (
                <span className="material-symbols-outlined" style={{ color: validUrl ? '#00E5FF' : '#FF3D57', fontSize: 18 }}>
                  {validUrl ? 'check_circle' : 'cancel'}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          backgroundColor: 'rgba(41,42,46,0.5)',
          borderTop: '1px solid rgba(59,73,76,0.2)',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            backgroundColor: '#0d0e12',
            borderRadius: 8, border: '1px solid rgba(59,73,76,0.2)',
          }}>
            {['text', 'url'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px',
                backgroundColor: tab === t ? 'rgba(0,229,255,0.1)' : 'transparent',
                color: tab === t ? '#00E5FF' : '#bac9cc',
                border: 'none', cursor: 'pointer', borderRadius: 6,
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
                transition: 'all 0.15s',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {t === 'text' ? 'description' : 'link'}
                </span>
                {t === 'text' ? 'Text' : 'URL'}
              </button>
            ))}
          </div>

          {/* Analyze button */}
          <button onClick={() => canSubmit && onSubmit(tab, content)} disabled={!canSubmit} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0.6rem 1.5rem',
            backgroundColor: canSubmit ? '#00E5FF' : 'rgba(255,255,255,0.05)',
            color: canSubmit ? '#00363d' : '#556070',
            border: 'none', borderRadius: 999, cursor: canSubmit ? 'pointer' : 'not-allowed',
            fontFamily: 'Space Grotesk', fontWeight: 700,
            fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em',
            transition: 'all 0.2s',
            boxShadow: canSubmit ? '0 0 20px rgba(0,229,255,0.4)' : 'none',
          }}>
            {disabled ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid #00363d', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                Analyze
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Suggestion chips */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
        gap: '0.75rem', width: '100%', maxWidth: 720,
        marginTop: '2rem',
      }}>
        {CHIPS.map(chip => (
          <button key={chip} onClick={() => { setTab('text'); setContent(chip); }} disabled={disabled} style={{
            backgroundColor: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem',
            borderRadius: 999, border: '1px solid rgba(59,73,76,0.3)',
            cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
            fontFamily: 'Manrope', fontSize: 13, color: '#e3e2e8',
          }}
            onMouseEnter={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.5)'; e.currentTarget.style.color = '#00E5FF'; } }}
            onMouseLeave={e => { if (!disabled) { e.currentTarget.style.borderColor = 'rgba(59,73,76,0.3)'; e.currentTarget.style.color = '#e3e2e8'; } }}
          >
            {chip}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
