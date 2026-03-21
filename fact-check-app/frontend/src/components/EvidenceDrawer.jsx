import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Shield } from 'lucide-react';

export const EvidenceDrawer = ({ citations, onClose }) => {
  const isOpen = citations && citations.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-brand-panel border-l border-brand-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border bg-brand-bg/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-brand-true" />
                <span className="text-xs font-mono uppercase tracking-widest text-white">
                  Evidence Sources
                </span>
                <span className="text-[10px] font-mono text-brand-muted bg-brand-true/10 border border-brand-true/20 px-2 py-0.5 rounded-sm">
                  {citations.length}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-sm transition-colors text-brand-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sources list */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {citations.map((cite, i) => {
                let hostname = '';
                try { hostname = new URL(cite.url).hostname; } catch {}
                return (
                  <div
                    key={i}
                    className="bg-black/40 border border-brand-border rounded-sm p-4 hover:border-white/15 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-xs text-gray-200 leading-snug flex-1 font-sans">
                        {cite.title}
                      </h4>
                      <a
                        href={cite.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-true hover:text-white transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <div className="text-[10px] font-mono text-brand-true/60 mb-3">{hostname}</div>
                    <p className="text-[11px] text-gray-500 leading-relaxed border-l-2 border-brand-muted/20 pl-3 italic">
                      {cite.snippet || cite.relevantSnippet || 'No snippet available.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
