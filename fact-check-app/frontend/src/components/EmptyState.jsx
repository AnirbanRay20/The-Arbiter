import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLACEHOLDERS = [
  'Paste text or drop a URL to fact-check...',
  'Try: "The moon landing happened on July 20, 1969..."',
  'Try: https://example.com/news-article',
  'Try: "Scientists confirm that X causes Y..."',
];

const SUGGESTIONS = [
  { icon: 'newspaper', title: 'News Article',    desc: 'Cross-reference breaking headlines with verified wire services.' },
  { icon: 'campaign',  title: 'Political Speech', desc: 'Scan transcripts for historical accuracy and policy consistency.' },
  { icon: 'science',   title: 'Research Paper',   desc: 'Validate methodology, citations, and conflicting peer studies.' },
];

export default function EmptyState({ onSubmit, disabled }) {
  const [tab, setTab]         = useState('text');
  const [content, setContent] = useState('');
  const [phIdx, setPhIdx]     = useState(0);

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
        marginBottom: '1.5rem',
      }}>
        What do you want<br />to verify today?
      </h2>

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
        border: '1px solid rgba(59,73,76,0.3)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}>
        <AnimatePresence mode="wait">
          {!isUrl ? (
            <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={PLACEHOLDERS[phIdx]}
                disabled={disabled}
                rows={6}
                style={{
                  width: '100%', background: 'transparent',
                  border: 'none', outline: 'none',
                  padding: '1.5rem', resize: 'none',
                  fontFamily: 'Manrope', fontSize: '1.1rem',
                  color: '#e3e2e8', lineHeight: 1.6,
                }}
              />
            </motion.div>
          ) : (
            <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', padding: '1.25rem 1.5rem', gap: 8 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', color: '#556070', fontSize: 14 }}>https://</span>
              <input
                type="url"
                value={content}
                onChange={e => setContent(e.target.value)}
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
            border: 'none', borderRadius: 999, cursor: canSubmit ? 'not-allowed' : 'not-allowed',
            fontFamily: 'Space Grotesk', fontWeight: 700,
            fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.1em',
            transition: 'all 0.2s',
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

      {/* Suggestion cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem', width: '100%', maxWidth: 720,
        marginTop: '3rem',
      }}>
        {SUGGESTIONS.map(card => (
          <div key={card.title} style={{
            backgroundColor: '#1a1b20', padding: '1.25rem',
            borderRadius: 12, border: '1px solid rgba(59,73,76,0.2)',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,229,255,0.3)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,229,255,0.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(59,73,76,0.2)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              backgroundColor: '#343439',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '1rem',
            }}>
              <span className="material-symbols-outlined" style={{ color: '#00E5FF', fontSize: 20 }}>{card.icon}</span>
            </div>
            <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '-0.01em', color: '#e3e2e8', marginBottom: 6 }}>
              {card.title}
            </h4>
            <p style={{ fontFamily: 'Manrope', fontSize: 12, color: '#bac9cc', lineHeight: 1.5 }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
