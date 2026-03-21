import React from 'react';
import { motion } from 'framer-motion';

export default function AccuracyReport({ report }) {
  if (!report) return null;
  const { total, true: t, partial, false: f, unverifiable, accuracyScore, riskLevel } = report;

  const isHigh = riskLevel.includes('High');
  const isMed  = riskLevel.includes('Medium');
  const isLow  = riskLevel.includes('Low');
  const ringColor = isLow ? '#00E5FF' : isMed ? '#FFAB00' : isHigh ? '#FF3D57' : '#556070';
  const circumference = 2 * Math.PI * 44;

  const downloadReport = () => {
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'arbiter_report.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'True',    value: t,           color: '#00E5FF', border: '#00E5FF' },
    { label: 'Partial', value: partial,      color: '#FFAB00', border: '#FFAB00' },
    { label: 'False',   value: f,            color: '#FF3D57', border: '#FF3D57' },
    { label: 'Unknown', value: unverifiable, color: '#556070', border: '#556070' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: '#292a2e', borderRadius: 8, padding: '2rem',
        display: 'grid', gridTemplateColumns: '260px 1fr', gap: '3rem',
        alignItems: 'center', marginBottom: '2rem',
        borderTop: `3px solid ${ringColor}`,
      }}
    >
      {/* Gauge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', width: 180, height: 180 }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="44" fill="none"
              stroke={ringColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * accuracyScore / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 8px ${ringColor})` }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 40, color: '#e3e2e8', lineHeight: 1 }}>
              {accuracyScore}%
            </span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#556070', marginTop: 4 }}>
              Accuracy
            </span>
          </div>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 500, fontSize: 22, color: '#e3e2e8', marginBottom: 4 }}>
              Session Intelligence Report
            </h3>
            <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc' }}>Forensic Analysis Complete</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{
              fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700,
              padding: '4px 10px', textTransform: 'uppercase',
              color: ringColor, border: `1px solid ${ringColor}`,
              backgroundColor: `${ringColor}15`, letterSpacing: '0.05em',
              borderRadius: 2,
            }}>
              {riskLevel}
            </span>
            <button onClick={downloadReport} style={{
              backgroundColor: '#e3e2e8', color: '#121317',
              padding: '6px 16px', border: 'none', cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em',
              borderRadius: 2,
            }}>
              Export Report
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{
              backgroundColor: '#1a1b20', padding: '1rem',
              borderBottom: `2px solid ${s.border}`,
              borderRadius: '4px 4px 0 0',
            }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, textTransform: 'uppercase', color: '#bac9cc', display: 'block', marginBottom: 6 }}>
                {s.label}
              </span>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8' }}>
                {String(s.value).padStart(2, '0')}
                <span style={{ fontSize: 14, color: '#556070', fontWeight: 400, marginLeft: 4 }}>/ {total}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
