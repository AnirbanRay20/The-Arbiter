import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, AlertCircle, Copy, Share2, RefreshCcw } from 'lucide-react';

export const AIDetectionPanel = ({ detectionResult, onReanalyze }) => {
  if (!detectionResult) return null;

  const { aiProbability, signals, summary } = detectionResult;
  const pct = Math.round((aiProbability || 0) * 100);

  const isAI = pct > 70;
  const isMixed = pct > 40 && pct <= 70;
  const color = isAI ? '#FF3D57' : isMixed ? '#FFAB00' : '#00E5FF';
  const label = isAI ? 'AI GENERATED' : isMixed ? 'MIXED ORIGIN' : 'HUMAN AUTHORED';
  const Icon = isAI ? AlertCircle : isMixed ? Activity : ShieldCheck;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto space-y-6 py-8"
    >
      {/* 1. Main Verdict Card (Hero Section) */}
      <div className="bg-[#161820] border border-white/5 rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden group">
        {/* Abstract background glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000"
          style={{ backgroundColor: color }}
        />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">Verification Verdict</span>
          </motion.div>

          <Icon className="w-16 h-16 mb-6" style={{ color }} />
          
          <h2 className="text-6xl md:text-7xl font-black tracking-tighter text-white mb-4 italic uppercase">
            {label}
          </h2>
          
          <div className="flex items-center gap-2 mb-8">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
            <span className="text-sm font-medium tracking-[0.1em] text-gray-400 uppercase">
              Forensic Confidence: <span className="text-white font-bold">{100 - pct}% Human Certainty</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {signals?.map((sig, i) => (
              <span 
                key={i} 
                className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:border-white/30 transition-colors"
              >
                {sig}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* 2. Analysis Chart & Prob. Gauge (4 Cols) */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="bg-[#161820] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center shadow-xl min-h-[300px]">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-8">Probability Matrix</h4>
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                <motion.circle
                  cx="50" cy="50" r="42"
                  fill="none"
                  stroke={color}
                  strokeWidth="6"
                  strokeDasharray="264"
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * (pct / 100)) }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white">{pct}%</span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">AI Score</span>
              </div>
            </div>
            <div className="mt-8 w-full space-y-3">
               <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                  <span className="text-gray-500">Human</span>
                  <span className="text-white">{100 - pct}%</span>
               </div>
               <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${100 - pct}%` }} />
               </div>
            </div>
          </div>
        </div>

        {/* 3. Logical Summary / Explanation (8 Cols) */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="bg-[#161820] border border-white/5 rounded-3xl p-8 shadow-xl flex-1">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Linguistic Analysis
            </h4>
            <p className="text-lg text-gray-300 leading-relaxed font-medium">
              {summary}
            </p>
            <div className="mt-10 pt-8 border-t border-white/5 flex flex-wrap gap-4">
               <button 
                onClick={() => { navigator.clipboard.writeText(summary); alert('Summary copied!'); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" /> Copy Summary
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-gray-300 border border-white/5 transition-all">
                <Share2 className="w-3.5 h-3.5" /> Share Report
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-cyan-500/20"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Re-Analyze
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
