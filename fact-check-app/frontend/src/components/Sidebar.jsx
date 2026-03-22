import React from 'react';

const NAV = [
  { icon: 'gavel',     label: 'Dashboard',   id: 'dashboard'   },
  { icon: 'history',   label: 'History',     id: 'history'     },
  { icon: 'lightbulb', label: 'Suggestions', id: 'suggestions' },
];

const BOTTOM_NAV = [
  { icon: 'help_outline', label: 'Support', id: 'support' },
];

export default function Sidebar({ activeView, onNavigate, onNewCheck }) {
  const NavItem = ({ item }) => {
    const isActive = activeView === item.id;
    return (
      <button
        onClick={() => item.id === 'dashboard' ? onNewCheck() : onNavigate(item.id)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%',
          padding: '0.65rem 1rem',
          color: isActive ? '#00E5FF' : 'rgba(227,226,232,0.55)',
          backgroundColor: isActive ? '#292a2e' : 'transparent',
          borderLeft: isActive ? '3px solid #00E5FF' : '3px solid transparent',
          fontFamily: 'Space Grotesk', fontWeight: 700,
          fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase',
          border: 'none', cursor: 'pointer',
          transition: 'all 0.2s', textAlign: 'left', marginBottom: 2,
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = '#e3e2e8'; e.currentTarget.style.backgroundColor = '#292a2e'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'rgba(227,226,232,0.55)'; e.currentTarget.style.backgroundColor = 'transparent'; }}}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{item.icon}</span>
        {item.label}
      </button>
    );
  };

  return (
    <aside style={{
      width: 248, minHeight: '100vh', display: 'flex', flexDirection: 'column',
      backgroundColor: '#1a1b20', position: 'sticky', top: 0, zIndex: 40, flexShrink: 0,
    }}>

      {/* ── Logo + Title ── */}
      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>

        {/* Logo image with fallback to shield icon */}
        <img
          src="/images/logo.png"
          alt="The Arbiter"
          style={{
            width: 36, height: 36, objectFit: 'contain', flexShrink: 0,
            filter: 'drop-shadow(0 0 8px rgba(0,229,255,0.4))',
          }}
          onError={e => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling.style.display = 'flex';
          }}
        />

        {/* Fallback shield — shown only if logo.png missing */}
        <div style={{
          display: 'none', width: 34, height: 34, borderRadius: 8,
          backgroundColor: '#00e5ff', flexShrink: 0,
          alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 14px rgba(0,229,255,0.3)',
        }}>
          <span className="material-symbols-outlined" style={{ color: '#00363d', fontSize: 19, fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
        </div>

        {/* Title text */}
        <div>
          <h1 style={{
            color: '#00E5FF', fontFamily: 'Space Grotesk', fontWeight: 700,
            fontSize: 19, letterSpacing: '-0.02em', lineHeight: 1,
          }}>
            The Arbiter
          </h1>
          <p style={{
            fontFamily: 'Space Grotesk', fontWeight: 700,
            textTransform: 'uppercase', fontSize: '0.58rem',
            letterSpacing: '0.06em', color: 'rgba(186,201,204,0.5)', marginTop: 2,
          }}>
            Forensic Intelligence
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '0.5rem 0.75rem 0' }}>
        {NAV.map(item => <NavItem key={item.id} item={item} />)}
      </nav>

      {/* New Fact Check CTA */}
      <div style={{ padding: '1rem 0.75rem' }}>
        <button
          onClick={onNewCheck}
          style={{
            width: '100%', padding: '0.8rem',
            backgroundColor: '#00e5ff', color: '#00363d',
            fontFamily: 'Space Grotesk', fontWeight: 700,
            fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.15em',
            border: 'none', borderRadius: 999, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 0 16px rgba(0,229,255,0.25)', transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 15 }}>add</span>
          New Fact Check
        </button>
      </div>

      {/* Bottom nav — Support */}
      <div style={{ padding: '0.5rem 0.75rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {BOTTOM_NAV.map(item => <NavItem key={item.id} item={item} />)}
      </div>
    </aside>
  );
}
