import React from 'react';

export default function TopBar({ isProcessing }) {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 1.5rem',
      backgroundColor: 'rgba(18,19,23,0.8)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
      flexShrink: 0,
    }}>
      {/* Left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{
          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18,
          color: '#00E5FF', letterSpacing: '-0.01em',
        }}>
          {isProcessing ? 'System Active' : 'System Ready'}
        </h2>
        <div className={isProcessing ? 'animate-pulse' : ''} style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: isProcessing ? '#00E5FF' : '#556070',
        }} />
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button style={{ background: 'none', border: 'none', color: '#e3e2e8', cursor: 'pointer', padding: 8, opacity: 0.7 }}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button style={{ background: 'none', border: 'none', color: '#e3e2e8', cursor: 'pointer', padding: 8, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.7 }}>
          <span className="material-symbols-outlined">account_circle</span>
          <span style={{ fontFamily: 'Space Grotesk', fontSize: 14, fontWeight: 500 }}>Investigator_01</span>
        </button>
      </div>
    </header>
  );
}
