import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const VERDICT_CFG = {
  'True':           { color: '#00E5FF', bg: 'rgba(0,229,255,0.1)',  border: 'rgba(0,229,255,0.25)', left: '#00E5FF', icon: 'check_circle' },
  'False':          { color: '#FF3D57', bg: 'rgba(255,61,87,0.1)',  border: 'rgba(255,61,87,0.25)', left: '#FF3D57', icon: 'cancel'       },
  'Partially True': { color: '#FFAB00', bg: 'rgba(255,171,0,0.1)',  border: 'rgba(255,171,0,0.25)', left: '#FFAB00', icon: 'balance'      },
  'Unverifiable':   { color: '#556070', bg: 'rgba(85,96,112,0.1)', border: 'rgba(85,96,112,0.25)',  left: '#556070', icon: 'help'         },
};

export default function ClaimCard({ claimData, onViewSources }) {
  const [expanded, setExpanded] = useState(false);
  const { claim, verdict, confidenceScore, reasoning, citations } = claimData;
  const cfg = VERDICT_CFG[verdict] || VERDICT_CFG['Unverifiable'];
  const pct = Math.round((confidenceScore || 0) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, boxShadow: `0 8px 30px ${cfg.bg}` }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl bg-[#121317] border border-white/5 shadow-lg flex flex-col"
    >
      {/* Top Banner / Verdict Bar */}
      <div 
        className="h-1.5 w-full shrink-0"
        style={{ backgroundColor: cfg.left }}
      />

      <div className="p-6 md:p-8 flex flex-col gap-4 flex-1">
        {/* Header: Verdict & Confidence */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl" style={{ color: cfg.color }}>
              {cfg.icon}
            </span>
            <span 
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              {verdict}
            </span>
          </div>
          <span className="font-mono text-[11px] text-gray-500 tracking-wider">
            {pct}% CONFIDENCE
          </span>
        </div>

        {/* Claim Text (Title) */}
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-100 line-clamp-2 leading-snug">
            "{claim}"
          </h3>
          <p className="mt-2 text-sm text-gray-400 line-clamp-1">
            {reasoning.split('.')[0]}.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-2 flex items-center justify-between pt-4 border-t border-white/5 shrink-0">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-[10px] text-gray-400 hover:text-gray-200 transition-colors uppercase tracking-wider font-mono bg-transparent border-none p-0 cursor-pointer"
          >
            {expanded ? 'Hide Details' : 'View Analysis'}
            <span className="material-symbols-outlined text-[16px]">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          
          {citations?.length > 0 && (
            <button 
              onClick={() => onViewSources(citations)}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider font-mono flex items-center gap-1.5 bg-transparent border-none p-0 cursor-pointer"
            >
              {citations.length} Source{citations.length !== 1 ? 's' : ''}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* Expanded Reasoning */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-[#0d0e12] border-t border-white/5 shrink-0"
          >
            <div className="p-6 text-sm text-gray-300 leading-relaxed font-sans flex flex-col gap-4">
              <div>
                <span className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-2">
                  Full AI Reasoning
                </span>
                {reasoning}
              </div>
              
              {claimData.conflictingEvidence && (
                <div className="flex items-start gap-2 bg-[#FFAB00]/5 border border-[#FFAB00]/20 p-3 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-[#FFAB00] mt-0.5">warning</span>
                  <div>
                    <span className="font-mono text-[10px] text-[#FFAB00] uppercase font-bold block mb-1">Conflicting Sources</span>
                    <span className="text-xs text-gray-400">{claimData.conflictNote}</span>
                  </div>
                </div>
              )}
              
              {claimData.temporallySensitive && (
                <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 p-3 rounded-lg">
                  <span className="material-symbols-outlined text-[16px] text-gray-400">schedule</span>
                  <span className="font-mono text-[10px] text-gray-400 uppercase">Time-sensitive — evidence may be outdated</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

