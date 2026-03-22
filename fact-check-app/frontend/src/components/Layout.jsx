import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ 
  children, 
  activeView = 'dashboard', 
  onNavigate, 
  onNewCheck,
  isProcessing = false,
  customHeader = undefined,
  hideSidebar = false
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#121317' }}>
      {!hideSidebar && (
        <Sidebar
          activeView={activeView}
          onNavigate={onNavigate || (() => {})}
          onNewCheck={onNewCheck || (() => {})}
        />
      )}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#0d0e12' }}>
        {customHeader !== undefined ? customHeader : <TopBar isProcessing={isProcessing} />}

        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 6rem', width: '100%' }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
