import React from 'react';

const NAV = [
  { id: 'dashboard',   icon: 'gavel',       label: 'Dashboard' },
  { id: 'history',     icon: 'history',     label: 'History' },
  { id: 'suggestions', icon: 'lightbulb',   label: 'Suggestions' },
];

export default function Sidebar({ activeView, onNavigate, onNewCheck }) {
  return (
    <aside style={{
      width: 248, minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#1a1b20', position: 'sticky', top: 0, zIndex: 40,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#00e5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ color: '#00363d', fontSize: 18, fontVariationSettings: "'FILL' 1" }}>shield</span>
        </div>
        <div>
          <h1 style={{ color: '#00E5FF', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', lineHeight: 1 }}>
            The Arbiter
          </h1>
          <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', color: 'rgba(186,201,204,0.6)', marginTop: 2 }}>
            Forensic Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 1rem 0' }}>
        {NAV.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button key={item.id} onClick={() => onNavigate(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '0.75rem 1rem', cursor: 'pointer', border: 'none',
                color: isActive ? '#00E5FF' : 'rgba(227,226,232,0.6)',
                backgroundColor: isActive ? '#292a2e' : 'transparent',
                borderLeft: isActive ? '4px solid #00E5FF' : '4px solid transparent',
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase',
                transition: 'all 0.2s', marginBottom: 4, textAlign: 'left'
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#e3e2e8'; e.currentTarget.style.backgroundColor = '#292a2e'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(227,226,232,0.6)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* New Fact Check CTA */}
      <div style={{ padding: '1rem' }}>
        <button onClick={onNewCheck} style={{
          width: '100%', padding: '0.85rem',
          backgroundColor: '#00e5ff', color: '#00363d',
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Fact Check
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '0.5rem 1rem 2rem' }}>
        {[{ icon: 'settings', label: 'Settings' }, { icon: 'help_outline', label: 'Support' }].map(item => (
          <a key={item.label} href="#" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '0.5rem 1rem', color: 'rgba(227,226,232,0.6)',
            fontFamily: 'Space Grotesk', fontWeight: 700,
            fontSize: '0.75rem', letterSpacing: '0.05em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = '#e3e2e8'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(227,226,232,0.6)'}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
