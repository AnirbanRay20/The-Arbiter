import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SCROLLBAR_STYLES = `
  .history-scroll::-webkit-scrollbar {
    width: 4px;
  }
  .history-scroll::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.03);
    border-radius: 10px;
  }
  .history-scroll::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #FFAB00, #FF6B00);
    border-radius: 10px;
    box-shadow: 0 0 8px rgba(255,171,0,0.8), 0 0 16px rgba(255,171,0,0.4);
  }
  .history-scroll::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FFD700, #FFAB00);
    box-shadow: 0 0 14px rgba(255,171,0,1), 0 0 28px rgba(255,171,0,0.6);
  }
  .history-scroll {
    scrollbar-width: thin;
    scrollbar-color: #FFAB00 rgba(255,255,255,0.03);
  }
`;

export default function HistoryView({ onSelect, onGoToDashboard }) {
  const [history, setHistory]   = useState([]);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [sortBy, setSortBy]     = useState('date');
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem('arbiter_history') || '[]'));
  }, []);

  const save = (updated) => {
    setHistory(updated);
    localStorage.setItem('arbiter_history', JSON.stringify(updated));
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
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
      showToast('Investigation deleted');
    }
  };

  const shareItem = (e, id) => {
    e.stopPropagation();
    const item = history.find(h => h.id === id);
    if (!item) return;

    // If full report data is stored, build a real share link
    if (item.report && item.claims && onShare) {
      const url = onShare(item.q, item.report, item.claims);
      if (url) {
        showToast('Share link copied! Anyone with this link can view the report.');
        return;
      }
    }

    // Fallback: copy just the query text
    navigator.clipboard.writeText(item.q);
    showToast('Query copied to clipboard');
  };

  const toggleStar = (e, id) => {
    e.stopPropagation();
    const item = history.find(h => h.id === id);
    save(history.map(h => h.id === id ? { ...h, starred: !h.starred } : h));
    showToast(item?.starred ? 'Removed from starred' : 'Added to starred');
  };

  const starredCount = history.filter(h => h.starred).length;

  const displayed = useMemo(() => {
    let result = filter === 'starred' ? history.filter(h => h.starred) : history;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(h =>
        h.q?.toLowerCase().includes(q) || h.risk?.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'accuracy') result = [...result].sort((a, b) => (b.acc || 0) - (a.acc || 0));
    else if (sortBy === 'risk') result = [...result].sort((a, b) => {
      const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const ra = Object.keys(order).find(k => a.risk?.includes(k)) || 'Medium';
      const rb = Object.keys(order).find(k => b.risk?.includes(k)) || 'Medium';
      return order[ra] - order[rb];
    });
    else result = [...result].sort((a, b) => new Date(b.date) - new Date(a.date));
    return result;
  }, [history, filter, search, sortBy]);

  const avgAccuracy = history.length
    ? Math.round(history.reduce((s, h) => s + (h.acc || 0), 0) / history.length)
    : 0;
  const highRiskCount = history.filter(h => h.risk?.includes('High')).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Inject scrollbar styles */}
      <style>{SCROLLBAR_STYLES}</style>

      {/* Outer wrapper - NOT scrollable */}
      <div
        style={{
          width: '100%', maxWidth: 900, margin: '0 auto',
          padding: '2.5rem 1.5rem 0',
        }}
      >
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 28, color: '#e3e2e8', marginBottom: 4 }}>
              Investigations Done
            </h2>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {history.length} session{history.length !== 1 ? 's' : ''} · {starredCount} starred
            </p>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory} style={{
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

        {/* ── Stats strip ── */}
        {history.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Sessions', value: history.length,   icon: 'history',   color: '#00E5FF' },
              { label: 'Starred',        value: starredCount,      icon: 'star',      color: '#FFAB00' },
              { label: 'Avg Accuracy',   value: `${avgAccuracy}%`, icon: 'analytics', color: '#00E5FF' },
              { label: 'High Risk',      value: highRiskCount,     icon: 'warning',   color: '#FF3D57' },
            ].map(stat => (
              <div key={stat.label} style={{
                backgroundColor: '#161820', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8, padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: stat.color }}>{stat.icon}</span>
                <div>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#e3e2e8', margin: 0, lineHeight: 1 }}>
                    {stat.value}
                  </p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '3px 0 0' }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Search + Filter + Sort ── */}
        {history.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: '#556070', pointerEvents: 'none',
              }}>search</span>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search investigations..."
                style={{
                  width: '100%', backgroundColor: '#161820',
                  border: `1px solid ${search ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 8, padding: '0.55rem 2.25rem 0.55rem 2rem',
                  fontFamily: 'Manrope', fontSize: 13, color: '#e3e2e8',
                  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.4)'}
                onBlur={e => e.target.style.borderColor = search ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.06)'}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#556070',
                  display: 'flex', alignItems: 'center',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 4, padding: 3, backgroundColor: '#161820', borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
              {[
                { id: 'all',     icon: 'history', label: 'All'     },
                { id: 'starred', icon: 'star',    label: 'Starred' },
              ].map(f => (
                <button key={f.id} onClick={() => setFilter(f.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0.4rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
                  backgroundColor: filter === f.id ? 'rgba(0,229,255,0.1)' : 'transparent',
                  color: filter === f.id ? '#00E5FF' : '#556070',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14,
                    fontVariationSettings: f.id === 'starred' && filter === 'starred' ? "'FILL' 1" : "'FILL' 0",
                  }}>{f.icon}</span>
                  {f.label}
                  {f.id === 'starred' && starredCount > 0 && (
                    <span style={{
                      backgroundColor: filter === 'starred' ? '#00E5FF' : '#556070',
                      color: filter === 'starred' ? '#00363d' : '#0d0e12',
                      borderRadius: 999, fontSize: 9, fontWeight: 700, padding: '1px 5px',
                    }}>{starredCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div style={{ position: 'relative' }}>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
                appearance: 'none', backgroundColor: '#161820',
                border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8,
                padding: '0.5rem 2rem 0.5rem 0.75rem',
                fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: '#bac9cc', cursor: 'pointer', outline: 'none',
              }}>
                <option value="date">Sort: Recent</option>
                <option value="accuracy">Sort: Accuracy</option>
                <option value="risk">Sort: Risk</option>
              </select>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, color: '#556070', pointerEvents: 'none',
              }}>expand_more</span>
            </div>
          </div>
        )}

        {/* Search results count */}
        {search && history.length > 0 && (
          <div style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00E5FF' }}>manage_search</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc' }}>
              {displayed.length} result{displayed.length !== 1 ? 's' : ''} for "<span style={{ color: '#00E5FF' }}>{search}</span>"
            </span>
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070',
              textDecoration: 'underline', padding: 0,
            }}>Clear</button>
          </div>
        )}

        {/* Empty: no history */}
        {history.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', gap: '1.25rem' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: '#1a1b20', border: '1px solid rgba(59,73,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: '#556070' }}>history</span>
            </div>
            <div>
              <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 18, color: '#e3e2e8', marginBottom: 8 }}>No investigations yet</p>
              <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#556070', lineHeight: 1.6 }}>Complete a fact-check to see your session history here.</p>
            </div>
            <button onClick={onGoToDashboard} style={{
              marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: 8,
              padding: '0.7rem 1.75rem', backgroundColor: '#00E5FF', color: '#00363d',
              border: 'none', borderRadius: 999, cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
              textTransform: 'uppercase', letterSpacing: '0.12em',
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', textAlign: 'center', gap: '1rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 44, color: '#556070' }}>
              {search ? 'search_off' : 'star'}
            </span>
            <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 16, color: '#e3e2e8' }}>
              {search ? `No results for "${search}"` : 'No starred investigations'}
            </p>
            <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070' }}>
              {search ? 'Try a different search term.' : 'Click ☆ on any session to save it here.'}
            </p>
            <button onClick={() => { setSearch(''); setFilter('all'); }} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.25rem',
              borderRadius: 999, border: '1px solid rgba(0,229,255,0.2)',
              backgroundColor: 'rgba(0,229,255,0.06)', color: '#00E5FF', cursor: 'pointer',
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
              Clear filters
            </button>
          </div>

        ) : (
          // Only the claims list scrolls — with orange glowing scrollbar
          <div
            className="history-scroll"
            style={{
              maxHeight: 'calc(100vh - 330px)',
              overflowY: 'auto',
              paddingRight: 6,
              paddingBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <AnimatePresence>
                {displayed.map((item, i) => (
                  <HistoryItem
                    key={item.id} item={item} index={i} searchQuery={search}
                    onSelect={onSelect} onDelete={deleteItem}
                    onShare={shareItem} onStar={toggleStar}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#00E5FF', color: '#00363d',
              padding: '10px 22px', borderRadius: 999,
              fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
              boxShadow: '0 8px 32px rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', gap: 8, zIndex: 1000, whiteSpace: 'nowrap',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HistoryItem({ item, index, searchQuery, onSelect, onDelete, onShare, onStar }) {
  const [hovered, setHovered] = useState(false);
  const riskColor = item.risk?.includes('High') ? '#FF3D57' : item.risk?.includes('Low') ? '#00E5FF' : '#FFAB00';

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span style={{ backgroundColor: 'rgba(0,229,255,0.2)', color: '#00E5FF', borderRadius: 2, padding: '0 2px' }}>
          {text.slice(idx, idx + query.length)}
        </span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -40 }} transition={{ delay: index * 0.04 }}
      onClick={() => onSelect && onSelect(item)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
        backgroundColor: hovered ? '#1a1c24' : item.starred ? 'rgba(255,171,0,0.03)' : '#161820',
        border: `1px solid ${hovered ? 'rgba(0,229,255,0.2)' : item.starred ? 'rgba(255,171,0,0.15)' : 'rgba(255,255,255,0.05)'}`,
        borderRadius: 8, cursor: 'pointer', overflow: 'hidden', transition: 'all 0.2s',
      }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        backgroundColor: item.starred ? '#FFAB00' : '#00E5FF',
        opacity: hovered || item.starred ? 1 : 0, transition: 'opacity 0.2s',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, overflow: 'hidden', paddingLeft: 6 }}>
        <span className="material-symbols-outlined" style={{ color: '#00E5FF', fontSize: 18, marginTop: 2, flexShrink: 0 }}>search</span>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <p style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 14, color: '#e3e2e8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 4 }}>
            "{highlightText(item.q, searchQuery)}"
          </p>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070' }}>
            {new Date(item.date).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <div style={{ textAlign: 'right', minWidth: 60 }}>
          <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{item.risk}</p>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: riskColor }}>
            {item.acc}%<span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', marginLeft: 3 }}>ACC</span>
          </p>
        </div>

        <button onClick={(e) => onStar(e, item.id)} style={{
          width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: item.starred ? 'rgba(255,171,0,0.12)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${item.starred ? 'rgba(255,171,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 6, cursor: 'pointer', color: item.starred ? '#FFAB00' : '#556070', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,171,0,0.18)'; e.currentTarget.style.color = '#FFAB00'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = item.starred ? 'rgba(255,171,0,0.12)' : 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = item.starred ? '#FFAB00' : '#556070'; }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: item.starred ? "'FILL' 1" : "'FILL' 0" }}>star</span>
        </button>

        <div style={{ display: 'flex', gap: 5, opacity: hovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button onClick={(e) => onShare(e, item.id)} style={{
            width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid transparent',
            borderRadius: 6, cursor: 'pointer', color: '#bac9cc', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,229,255,0.1)'; e.currentTarget.style.color = '#00E5FF'; e.currentTarget.style.borderColor = 'rgba(0,229,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#bac9cc'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>share</span>
          </button>
          <button onClick={(e) => onDelete(e, item.id)} style={{
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
