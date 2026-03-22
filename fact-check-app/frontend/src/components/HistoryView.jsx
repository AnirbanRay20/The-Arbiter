import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryView({ onSelect }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('arbiter_history') || '[]'));
  }, []);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('arbiter_history');
      setHistory([]);
    }
  };

  const deleteItem = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this?")) {
      const newHistory = history.filter(item => item.id !== id);
      setHistory(newHistory);
      localStorage.setItem('arbiter_history', JSON.stringify(newHistory));
    }
  };

  const shareItem = (e, q) => {
    e.stopPropagation();
    navigator.clipboard.writeText(q);
    alert('Query copied to clipboard!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 32, color: '#e3e2e8' }}>History</h2>
        {history.length > 0 && (
          <button onClick={clearHistory} style={{
            background: 'rgba(255,61,87,0.1)', border: '1px solid rgba(255,61,87,0.3)', color: '#FF3D57',
            padding: '0.5rem 1rem', borderRadius: 999, cursor: 'pointer', fontFamily: 'Space Grotesk',
            fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em'
          }}>Clear History</button>
        )}
      </div>
      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: '#161820', borderRadius: 8, border: '1px dashed rgba(59,73,76,0.3)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#556070', marginBottom: 16 }}>history</span>
          <p style={{ fontFamily: 'IBM Plex Mono', color: '#bac9cc' }}>No history found. Complete a fact-check to see it here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence>
            {history.map(item => (
              <motion.div 
                key={item.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -50 }}
                onClick={() => onSelect && onSelect(item.q)}
                className="group relative flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-6 bg-[#161820] hover:bg-[#1a1c24] border border-white/5 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-[0_4_20px_rgba(0,229,255,0.05)] overflow-hidden"
              >
                {/* Accent line on hover */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* LEFT: Query & Timestamp */}
                <div className="flex items-start gap-4 flex-1 overflow-hidden">
                  <span className="material-symbols-outlined text-cyan-500 mt-1 shrink-0">search</span>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-sans text-base text-gray-100 font-medium truncate">"{item.q}"</span>
                    <span className="font-mono text-[11px] text-gray-500 mt-2">
                        {new Date(item.date).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                    </span>
                  </div>
                </div>

                {/* RIGHT: Actions & Status */}
                <div className="flex flex-row sm:flex-row-reverse sm:items-center justify-between sm:justify-start w-full sm:w-auto gap-6 sm:gap-8 shrink-0">
                  
                  {/* Status & Accuracy */}
                  <div className="flex flex-col items-start sm:items-end text-left sm:text-right">
                    <span className="font-mono text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                      {item.risk}
                    </span>
                    <span 
                      className="font-sans font-bold text-xl"
                      style={{ color: item.risk?.includes('High') ? '#FF3D57' : item.risk?.includes('Low') ? '#00E5FF' : '#FFAB00' }}
                    >
                      {item.acc}% <span className="font-mono text-[10px] text-gray-500 uppercase">Acc</span>
                    </span>
                  </div>

                  {/* Hover Buttons */}
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 sm:pr-2">
                    <button 
                      onClick={(e) => shareItem(e, item.q)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/10 text-gray-400 hover:text-cyan-400 transition-colors flex items-center justify-center border border-transparent hover:border-cyan-500/20 shadow-sm"
                      title="Share (Copy)"
                    >
                      <span className="material-symbols-outlined text-[16px]">share</span>
                    </button>
                    <button 
                      onClick={(e) => deleteItem(e, item.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center border border-transparent hover:border-red-500/20 shadow-sm"
                      title="Delete Entry"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>

                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
