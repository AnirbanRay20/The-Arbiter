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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18,
            color: '#00E5FF', letterSpacing: '-0.01em', lineHeight: 1.2
          }}>
            {isProcessing ? 'System Active' : 'System Ready'}
          </h2>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#bac9cc', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Powered by Multi-Agent AI Verification Engine
          </span>
        </div>
        <div className={isProcessing ? 'animate-pulse' : ''} style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: isProcessing ? '#00E5FF' : '#556070',
        }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      </div>
    </header>
  );
}
