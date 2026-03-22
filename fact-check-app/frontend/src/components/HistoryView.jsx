import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HistoryView({ onSelect, onGoToDashboard }) {
  const [history, setHistory] = useState([]);
  const [filter, setFilter]   = useState('all'); // 'all' | 'starred'
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('arbiter_history') || '[]'));
  }, []);

  const save = (updated) => {
    setHistory(updated);
    localStorage.setItem('arbiter_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      localStorage.removeItem('arbiter_history');
      setHistory([]);
    }
  };

  const deleteItem = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Delete this investigation?')) {
      save(history.filter(item => item.id !== id));
    }
  };

  const shareItem = (e, id) => {
    e.stopPropagation();
    const url = `${window.location.origin}/chat/${id}`;
    navigator.clipboard.writeText(url);
    setToast('Link copied successfully');
    setTimeout(() => setToast(null), 3000);
  };

  const toggleStar = (e, id) => {
    e.stopPropagation();
    save(history.map(item =>
      item.id === id ? { ...item, starred: !item.starred } : item
    ));
  };

  const displayed    = filter === 'starred' ? history.filter(h => h.starred) : history;
  const starredCount = history.filter(h => h.starred).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ width: '100%', maxWidth: 860, margin: '0 auto', padding: '2.5rem 1.5rem' }}
    >
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8', marginBottom: 4 }}>
            Investigations
          </h2>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {history.length} session{history.length !== 1 ? 's' : ''} · {starredCount} starred
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={clearHistory}
            style={{
              background: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)',
              color: '#FF3D57', padding: '0.5rem 1.25rem', borderRadius: 999,
              cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,61,87,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,61,87,0.08)'}
          >
            Clear All
          </button>
        )}
      </div>

      {/* ── Filter tabs (only if history exists) ── */}
      {history.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.5rem' }}>
          {[
            { id: 'all',     label: 'All',     icon: 'history' },
            { id: 'starred', label: 'Starred', icon: 'star'    },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.45rem 1rem', borderRadius: 999, border: 'none',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
                backgroundColor: filter === f.id ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.04)',
                color: filter === f.id ? '#00E5FF' : '#556070',
                boxShadow: filter === f.id ? '0 0 12px rgba(0,229,255,0.15)' : 'none',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 15,
                  fontVariationSettings: (f.id === 'starred' && filter === 'starred') ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {f.icon}
              </span>
              {f.label}
              {f.id === 'starred' && starredCount > 0 && (
                <span style={{
                  backgroundColor: filter === 'starred' ? '#00E5FF' : '#556070',
                  color: filter === 'starred' ? '#00363d' : '#0d0e12',
                  borderRadius: 999, fontSize: 9, fontWeight: 700,
                  padding: '1px 6px', lineHeight: 1.6,
                }}>
                  {starredCount}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Empty: no history at all ── */}
      {history.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '55vh', textAlign: 'center', gap: '1.25rem',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: '#1a1b20', border: '1px solid rgba(59,73,76,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#556070' }}>history</span>
          </div>

          <div>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#e3e2e8', marginBottom: 8 }}>
              No investigations yet
            </p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#556070', lineHeight: 1.6 }}>
              Complete a fact-check to see your session history here.
            </p>
          </div>

          {/* ✅ Real button — navigates to dashboard */}
          <button
            onClick={onGoToDashboard}
            style={{
              marginTop: '0.25rem',
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.7rem 1.75rem',
              backgroundColor: '#00E5FF', color: '#00363d',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em',
              boxShadow: '0 0 24px rgba(0,229,255,0.3)', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 17 }}>arrow_back</span>
            Go to Dashboard
          </button>
        </div>

      ) : displayed.length === 0 ? (

        /* ── Empty: starred filter with no starred items ── */
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '40vh', textAlign: 'center', gap: '1rem',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#556070' }}>star</span>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: '#e3e2e8' }}>
            No starred investigations
          </p>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070' }}>
            Click ☆ on any session to save it here.
          </p>
          <button
            onClick={() => setFilter('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.5rem 1.25rem', borderRadius: 999,
              border: '1px solid rgba(0,229,255,0.2)',
              backgroundColor: 'rgba(0,229,255,0.06)',
              color: '#00E5FF', cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}
          >
            View all sessions
          </button>
        </div>

      ) : (

        /* ── History list ── */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <AnimatePresence>
            {displayed.map((item, i) => (
              <HistoryItem
                key={item.id}
                item={item}
                index={i}
                onSelect={onSelect}
                onDelete={deleteItem}
                onShare={shareItem}
                onStar={toggleStar}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#00E5FF',
              color: '#00363d',
              padding: '12px 24px',
              borderRadius: 999,
              fontFamily: 'Space Grotesk',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: '0 8px 32px rgba(0, 229, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 1000,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────── */
/* Single history row                          */
/* ─────────────────────────────────────────── */
function HistoryItem({ item, index, onSelect, onDelete, onShare, onStar }) {
  const [hovered, setHovered] = useState(false);

  const riskColor = item.risk?.includes('High') ? '#FF3D57'
                  : item.risk?.includes('Low')  ? '#00E5FF'
                  : '#FFAB00';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ delay: index * 0.04 }}
      onClick={() => onSelect && onSelect(item.q)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '1rem', padding: '1rem 1.25rem',
        backgroundColor: hovered ? '#1a1c24' : item.starred ? 'rgba(255,171,0,0.03)' : '#161820',
        border: `1px solid ${hovered ? 'rgba(0,229,255,0.2)' : item.starred ? 'rgba(255,171,0,0.15)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s',
      }}
    >
      {/* Accent bar */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        backgroundColor: item.starred ? '#FFAB00' : '#00E5FF',
        opacity: hovered || item.starred ? 1 : 0, transition: 'opacity 0.2s',
      }} />

      {/* Icon + text */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, overflow: 'hidden', paddingLeft: 6 }}>
        <span className="material-symbols-outlined" style={{ color: '#00E5FF', fontSize: 18, marginTop: 2, flexShrink: 0 }}>
          search
        </span>
        <div style={{ overflow: 'hidden' }}>
          <p style={{
            fontFamily: 'Manrope', fontWeight: 500, fontSize: 14, color: '#e3e2e8',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4,
          }}>
            "{item.q}"
          </p>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070' }}>
            {new Date(item.date).toLocaleString(undefined, {
              year: 'numeric', month: 'short', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

        {/* Accuracy */}
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
            {item.risk}
          </p>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: riskColor }}>
            {item.acc}%
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', marginLeft: 3 }}>ACC</span>
          </p>
        </div>

        {/* ⭐ Star — always visible */}
        <button
          onClick={(e) => onStar(e, item.id)}
          title={item.starred ? 'Remove from starred' : 'Star this investigation'}
          style={{
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: item.starred ? 'rgba(255,171,0,0.12)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${item.starred ? 'rgba(255,171,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 6, cursor: 'pointer',
            color: item.starred ? '#FFAB00' : '#556070',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,171,0,0.18)'; e.currentTarget.style.color = '#FFAB00'; e.currentTarget.style.borderColor = 'rgba(255,171,0,0.4)'; }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = item.starred ? 'rgba(255,171,0,0.12)' : 'rgba(255,255,255,0.04)';
            e.currentTarget.style.color           = item.starred ? '#FFAB00' : '#556070';
            e.currentTarget.style.borderColor     = item.starred ? 'rgba(255,171,0,0.35)' : 'rgba(255,255,255,0.06)';
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 17, fontVariationSettings: item.starred ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        </button>

        {/* Share + Delete — fade in on hover */}
        <div style={{ display: 'flex', gap: 5, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button
            onClick={(e) => onShare(e, item.id)}
            title="Copy query"
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid transparent',
              borderRadius: 6, cursor: 'pointer', color: '#bac9cc', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.1)'; e.currentTarget.style.color = '#00E5FF'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#bac9cc'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
          </button>

          <button
            onClick={(e) => onDelete(e, item.id)}
            title="Delete"
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid transparent',
              borderRadius: 6, cursor: 'pointer', color: '#bac9cc', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,61,87,0.1)'; e.currentTarget.style.color = '#FF3D57'; e.currentTarget.style.borderColor = 'rgba(255,61,87,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#bac9cc'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
