import React from 'react';
import { motion } from 'framer-motion';
import { ScanFace, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';

export const AIDetectionPanel = ({ detectionResult }) => {
  if (!detectionResult) return null;

  const { aiProbability, signals, summary } = detectionResult;
  const pct = Math.round((aiProbability || 0) * 100);

  const color = pct > 70 ? '#FF3D57' : pct > 40 ? '#FFAB00' : '#00E5FF';
  const label = pct > 70 ? 'Likely AI-Generated' : pct > 40 ? 'Mixed / Uncertain' : 'Likely Human';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card mt-8"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-brand-muted" />
          <span className="text-xs font-mono uppercase tracking-widest text-white">
            Forensic AI Detection
          </span>
        </div>
        <span className="text-[10px] font-mono border border-brand-border px-3 py-1 rounded-sm text-brand-muted uppercase tracking-widest">
          Bonus Module
        </span>
      </div>

      <div className="p-6 flex flex-col md:flex-row gap-8">
        {/* Meter */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeDasharray="264"
                initial={{ strokeDashoffset: 264 }}
                animate={{ strokeDashoffset: 264 - (264 * aiProbability) }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 6px ${color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-bold text-white">{pct}%</span>
              <span className="data-label mt-0.5">AI Prob.</span>
            </div>
          </div>
          <span
            className="text-[10px] font-mono uppercase tracking-widest font-semibold"
            style={{ color }}
          >
            {label}
          </span>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <p className="text-xs text-gray-400 leading-relaxed bg-black/40 border border-brand-border rounded-sm p-4">
            {summary}
          </p>

          {signals?.length > 0 && (
            <div>
              <div className="data-label mb-2">Detected Signals</div>
              <div className="flex flex-wrap gap-2">
                {signals.map((sig, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-brand-false/5 border border-brand-false/20 text-brand-false text-[10px] font-mono rounded-sm"
                  >
                    {sig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
