import React from 'react';
import { motion } from 'framer-motion';

const STEPS = ['EXTRACTING', 'SEARCHING', 'VERIFYING', 'REPORTING'];

export default function PipelineProgress({ currentStep, status, progress }) {
  const activeIdx = Math.max(0, STEPS.indexOf(currentStep));

  return (
    <div style={{
      backgroundColor: '#1a1b20', borderRadius: 8, padding: '1.5rem',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>

        {/* Status text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(0,229,255,0.6)' }}>
            Current Phase
          </span>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: status === 'error' ? '#FF3D57' : '#00E5FF' }}
            className={status !== 'error' ? 'animate-pulse' : ''}>
            &gt; {progress}
          </p>
        </div>

        {/* Steps track */}
        <div style={{ display: 'flex', flex: 1, minWidth: 300, maxWidth: 600 }}>
          {STEPS.map((step, idx) => {
            const done   = idx < activeIdx;
            const active = idx === activeIdx;
            return (
              <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '100%', height: 3,
                  backgroundColor: done || active ? '#00E5FF' : 'rgba(59,73,76,0.4)',
                  boxShadow: active ? '0 0 10px rgba(0,229,255,0.6)' : 'none',
                  transition: 'all 0.4s ease',
                }} />
                <span style={{
                  fontFamily: 'IBM Plex Mono', fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  marginTop: 8,
                  color: active ? '#00E5FF' : done ? 'rgba(0,229,255,0.5)' : 'rgba(186,201,204,0.3)',
                  fontWeight: active ? 700 : 400,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#00E5FF', display: 'inline-block' }} className="animate-pulse" />}
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* BG gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,229,255,0.04) 0%, transparent 60%)', pointerEvents: 'none' }} />
    </div>
  );
}
