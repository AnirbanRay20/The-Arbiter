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

  const stats = [
    { label: 'True',    value: t,           color: '#00E5FF' },
    { label: 'Partial', value: partial,      color: '#FFAB00' },
    { label: 'False',   value: f,            color: '#FF3D57' },
    { label: 'Unknown', value: unverifiable, color: '#556070' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: '1.75rem 1.75rem 1.25rem' }}
    >
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
          Session Intelligence Report
        </span>
        {/* Risk badge */}
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

      {/* Main content */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>

        {/* Gauge */}
        <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
          <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <motion.circle
              cx="50" cy="50" r="44" fill="none"
              stroke={ringColor} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * accuracyScore / 100) }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{ filter: `drop-shadow(0 0 6px ${ringColor})` }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8', lineHeight: 1 }}>
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
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Subtle glow bg */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: `linear-gradient(to top, ${s.color}08, transparent)`, pointerEvents: 'none' }} />
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, textTransform: 'uppercase', color: s.color, display: 'block', marginBottom: 6, letterSpacing: '0.1em' }}>
                {s.label}
              </span>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 24, color: '#e3e2e8', lineHeight: 1 }}>
                {String(s.value).padStart(2, '0')}
                <span style={{ fontSize: 11, color: '#556070', fontWeight: 400, marginLeft: 3 }}>/ {total}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stacked bar */}
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
    </motion.div>
  );
}
