import React from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  {
    id: 1, icon: 'input',         label: 'Input',
    desc: 'Text or URL',          color: '#bac9cc',
  },
  {
    id: 2, icon: 'content_cut',   label: 'Extract',
    desc: 'Atomic claims',        color: '#00E5FF',
  },
  {
    id: 3, icon: 'travel_explore',label: 'Search',
    desc: 'Live web evidence',    color: '#FFAB00',
  },
  {
    id: 4, icon: 'gavel',         label: 'Verify',
    desc: 'CoT reasoning',        color: '#00E5FF',
  },
  {
    id: 5, icon: 'analytics',     label: 'Report',
    desc: 'Accuracy + citations', color: '#00E5FF',
  },
];

export default function ExplainabilityFlow({ currentStep, isProcessing }) {
  // Map pipeline step names to step IDs
  const stepMap = {
    'INIT': 0, 'SCRAPING': 1, 'EXTRACTING': 2,
    'SEARCHING': 3, 'VERIFYING': 4, 'REPORTING': 5,
  };
  // When not processing and report is done, mark all steps complete (6 = past last step)
  const activeId = !isProcessing && currentStep === 'REPORTING'
    ? 6
    : (stepMap[currentStep] || 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: '#161820',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '1rem 1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070' }}>account_tree</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#556070' }}>
            Verification Pipeline
          </span>
        </div>
        {/* Done badge */}
        {!isProcessing && activeId >= 6 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#00E5FF', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Complete</span>
          </div>
        )}
        {/* Processing indicator */}
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, backgroundColor: 'rgba(255,171,0,0.08)', border: '1px solid rgba(255,171,0,0.2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FFAB00', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#FFAB00', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Running</span>
          </div>
        )}
      </div>

      {/* Flow steps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((step, i) => {
          const done   = step.id < activeId;
          const active = step.id === activeId && isProcessing;
          const color  = done || active ? step.color : 'rgba(85,96,112,0.4)';

          return (
            <React.Fragment key={step.id}>
              {/* Step node */}
              <motion.div
                animate={{ scale: active ? [1, 1.05, 1] : 1 }}
                transition={{ repeat: active ? Infinity : 0, duration: 1.5 }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 5, flex: 1,
                }}
              >
                {/* Icon circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  backgroundColor: done ? `${step.color}15` : active ? `${step.color}20` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: active ? `0 0 16px ${step.color}80, 0 0 32px ${step.color}30` : done ? `0 0 10px ${step.color}60, 0 0 20px ${step.color}20` : 'none',
                  transition: 'all 0.3s',
                  position: 'relative',
                }}>
                  {done ? (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color: step.color, fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                  ) : (
                    <span className="material-symbols-outlined" style={{ fontSize: 16, color, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                      {step.icon}
                    </span>
                  )}
                  {/* Pulse ring on active */}
                  {active && (
                    <motion.div
                      animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      style={{
                        position: 'absolute', inset: -3,
                        borderRadius: '50%',
                        border: `1px solid ${step.color}`,
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </div>

                {/* Label + desc */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{
                    fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                    color: done || active ? '#e3e2e8' : '#556070',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    margin: 0, lineHeight: 1,
                  }}>
                    {step.label}
                  </p>
                  <p style={{
                    fontFamily: 'IBM Plex Mono', fontSize: 9,
                    color: done || active ? color : '#3a4450',
                    margin: '2px 0 0', lineHeight: 1,
                  }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>

              {/* Connector arrow */}
              {i < STEPS.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 20, flexShrink: 0 }}>
                  <motion.div
                    animate={step.id < activeId ? { opacity: [0.4, 1, 0.4] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      width: 24, height: 1,
                      background: step.id < activeId
                        ? `linear-gradient(90deg, ${step.color}, ${STEPS[i+1].color})`
                        : 'rgba(85,96,112,0.2)',
                      position: 'relative',
                    }}
                  />
                  <span className="material-symbols-outlined" style={{
                    fontSize: 12,
                    color: step.id < activeId ? STEPS[i+1].color : 'rgba(85,96,112,0.25)',
                    marginLeft: -4,
                  }}>
                    arrow_forward_ios
                  </span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}
