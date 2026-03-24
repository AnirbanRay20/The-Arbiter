import React, { useRef } from 'react';
import { motion } from 'framer-motion';

export default function AccuracyReport({ report, onNewCheck, onShare, onPDF }) {
  if (!report) return null;
  const { total, true: t, partial, false: f, unverifiable, accuracyScore, riskLevel } = report;
  const reportRef = useRef(null);

  const isHigh = riskLevel.includes('High');
  const isMed  = riskLevel.includes('Medium');
  const isLow  = riskLevel.includes('Low');
  const ringColor = isLow ? '#00E5FF' : isMed ? '#FFAB00' : isHigh ? '#FF3D57' : '#556070';
  const circumference = 2 * Math.PI * 44;

  const stats = [
    { label: 'True',    value: t,           color: '#00E5FF' },
    { label: 'Partial', value: partial,      color: '#FFAB00' },
    { label: 'False',   value: f,            color: '#FF3D57' },
    { label: 'Unknown', value: unverifiable, color: '#556070' },
  ];

  // Download as JSON
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'arbiter_report.json'; a.click();
    URL.revokeObjectURL(url);
  };

  // Download as PNG image using Canvas
  const downloadImage = async () => {
    // Dynamically load html2canvas if not present
    if (!window.html2canvas) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    try {
      const canvas = await window.html2canvas(reportRef.current, {
        backgroundColor: '#161820',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL('image/png');
      const a   = document.createElement('a');
      a.href = url; a.download = 'arbiter_report.png'; a.click();
    } catch (err) {
      alert('Image export failed. Try JSON instead.');
      console.error(err);
    }
  };

  // Copy JSON to clipboard
  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert('Report copied to clipboard!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* ── Capturable report area ── */}
      <div ref={reportRef} style={{ padding: '1.75rem 1.75rem 1.25rem', backgroundColor: '#161820' }}>

        {/* Section label + Risk badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
            Session Intelligence Report
          </span>
          <span style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700,
            padding: '4px 12px', textTransform: 'uppercase', letterSpacing: '0.05em',
            color: ringColor, border: `1px solid ${ringColor}40`,
            backgroundColor: `${ringColor}12`, borderRadius: 4,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ringColor, display: 'inline-block' }} />
            {riskLevel}
          </span>
        </div>

        {/* Gauge + Stats */}
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>

          {/* Gauge */}
          <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
            <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              {stats.filter(s => s.value > 0).map((s, idx, arr) => {
                const prevSum = arr.slice(0, idx).reduce((sum, curr) => sum + curr.value, 0);
                const startPos = (prevSum / total) * circumference;
                const segmentLen = (s.value / total) * circumference;
                return (
                  <motion.circle
                    key={s.label}
                    cx="50" cy="50" r="44" fill="none"
                    stroke={s.color} strokeWidth="8"
                    strokeDasharray={`${segmentLen} ${circumference}`}
                    initial={{ strokeDashoffset: segmentLen }}
                    animate={{ strokeDashoffset: -startPos }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{ filter: `drop-shadow(0 0 4px ${s.color}60)` }}
                  />
                );
              })}
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: ringColor, lineHeight: 1 }}>
                {accuracyScore}%
              </span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#556070', marginTop: 4 }}>
                Accuracy
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                backgroundColor: '#0d0e12',
                padding: '0.9rem 1rem',
                borderRadius: '6px 6px 0 0',
                borderBottom: `2px solid ${s.color}`,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top, ${s.color}08, transparent)`, pointerEvents: 'none' }} />
                <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, textTransform: 'uppercase', color: s.color, display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>
                  {s.label}
                </span>
                <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: s.value > 0 ? s.color : '#e3e2e8', lineHeight: 1 }}>
                  {String(s.value).padStart(2, '0')}
                  <span style={{ fontSize: 11, color: '#556070', fontWeight: 400, marginLeft: 3 }}>/ {total}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked accuracy bar */}
        <div style={{ marginTop: '1.25rem', height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)', display: 'flex' }}>
          {stats.filter(s => s.value > 0).map(s => (
            <motion.div
              key={s.label}
              initial={{ width: 0 }}
              animate={{ width: `${(s.value / total) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', backgroundColor: s.color }}
            />
          ))}
        </div>

        {/* AI Insight Summary */}
        {report.insightSummary && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00E5FF' }}>auto_awesome</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, color: '#e3e2e8' }}>AI Insight Summary</span>
            </div>
            <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.6, margin: 0 }}>
              {report.insightSummary}
            </p>
          </div>
        )}
      </div>

      {/* ── Toolbar (outside capture area) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.75rem',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        backgroundColor: 'rgba(0,0,0,0.25)',
      }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {total} claim{total !== 1 ? 's' : ''} analyzed
        </span>

        <div style={{ display: 'flex', gap: 8 }}>
          {/* Copy */}
          <button onClick={copyJSON} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0.45rem 1rem',
            backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: '#bac9cc', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>content_copy</span>
            Copy
          </button>

          {/* Download dropdown */}
          <DownloadDropdown onJSON={downloadJSON} onImage={downloadImage} onPDF={onPDF} />

          {/* Share */}
          {onShare && (
            <button 
              onClick={async () => {
                const url = await onShare();
                if (url) {
                  const originalText = 'Share Link';
                  const btn = document.activeElement;
                  if (btn) {
                    const icon = btn.querySelector('.material-symbols-outlined');
                    const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() === 'Share Link' || n.textContent.trim() === 'Copied!');
                    if (textNode) {
                      textNode.textContent = 'Copied!';
                      btn.style.borderColor = '#00E5FF';
                      btn.style.backgroundColor = 'rgba(0,229,255,0.15)';
                      setTimeout(() => {
                        textNode.textContent = 'Share Link';
                        btn.style.borderColor = 'rgba(0,229,255,0.2)';
                        btn.style.backgroundColor = 'rgba(0,229,255,0.06)';
                      }, 2000);
                    }
                  }
                }
              }} 
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '0.45rem 1rem',
                backgroundColor: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)',
                color: '#00E5FF', borderRadius: 6, cursor: 'pointer',
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.12)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.06)'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
              Share Link
            </button>
          )}

          {/* New Check */}
          <button onClick={onNewCheck || (() => window.location.reload())} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '0.45rem 1rem',
            backgroundColor: '#00E5FF', border: 'none',
            color: '#00363d', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            boxShadow: '0 0 14px rgba(0,229,255,0.3)', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
            New Check
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Download dropdown component ── */
function DownloadDropdown({ onJSON, onImage, onPDF }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '0.45rem 1rem',
          backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#bac9cc', borderRadius: 6, cursor: 'pointer',
          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>download</span>
        Download
        <span className="material-symbols-outlined" style={{ fontSize: 13, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute', bottom: '110%', right: 0,
            backgroundColor: '#1f1f24',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: 180, zIndex: 100,
          }}
        >
          {/* JSON option */}
          <button
            onClick={() => { onJSON(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '0.75rem 1rem',
              backgroundColor: 'transparent', border: 'none',
              cursor: 'pointer', transition: 'background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(0,229,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF' }}>data_object</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#e3e2e8', margin: 0 }}>JSON Report</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full structured data</p>
            </div>
          </button>

          <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '0 0.75rem' }} />

          {/* PNG option */}
          <button
            onClick={() => { onImage(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '0.75rem 1rem',
              backgroundColor: 'transparent', border: 'none',
              cursor: 'pointer', transition: 'background 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,171,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#FFAB00' }}>image</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#e3e2e8', margin: 0 }}>PNG Image</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screenshot of report</p>
            </div>
          </button>

          {onPDF && (
            <>
              <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '0 0.75rem' }} />

              {/* PDF option */}
              <button
                onClick={() => { onPDF(); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '0.75rem 1rem',
                  backgroundColor: 'transparent', border: 'none',
                  cursor: 'pointer', transition: 'background 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ width: 30, height: 30, borderRadius: 6, backgroundColor: 'rgba(255,61,87,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#FF3D57' }}>picture_as_pdf</span>
                </div>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12, color: '#e3e2e8', margin: 0 }}>Forensic PDF</p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full detailed report</p>
                </div>
              </button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
