import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EvidenceDrawer } from './EvidenceDrawer';
import { getChat } from '../services/api';
import ResultDashboard from './ResultDashboard';
import Layout from './Layout';

export default function ChatView() {
  const navigate = useNavigate(); // Assume useNavigate is imported from 'react-router-dom', wait, it's not. Look at line 2.
  const { id } = useParams();
  const [chatData, setChatData] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const data = localStorage.getItem(`chat_${id}`);
        let parsedData = null;
        
        if (data) {
          parsedData = JSON.parse(data);
        }
        
        // If not in localStorage, fetch from backend API
        if (!parsedData || Object.keys(parsedData).length === 0) {
          parsedData = await getChat(id);
          // Save to local storage for faster subsequent loads
          if (parsedData) {
            localStorage.setItem(`chat_${id}`, JSON.stringify(parsedData));
          }
        }
        
        if (!parsedData || Object.keys(parsedData).length === 0) {
          console.log("Missing:", "chat_" + id);
          setChatData({ error: 'Chat not found or not saved' });
          return;
        }
        
        setChatData(parsedData);
      } catch (e) {
        console.log("Error finding chat:", e);
        setChatData({ error: 'Chat not found or not saved' });
      }
    };

    fetchChatData();
  }, [id]);

  if (!chatData) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121317', color: '#e3e2e8' }}>
        Loading...
      </div>
    );
  }

  if (chatData.error) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#121317', color: '#e3e2e8' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 24, marginBottom: 16 }}>{chatData.error}</h1>
        <Link to="/" style={{ color: '#00E5FF', textDecoration: 'none', border: '1px solid #00E5FF', padding: '8px 16px', borderRadius: 8 }}>Go to Dashboard</Link>
      </div>
    );
  }

  const { q, report, claims = [], processedClaims = [], aiDetection } = chatData;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${id}`);
    setToast('Link copied successfully');
    setTimeout(() => setToast(null), 3000);
  };

  const customHeader = (
    <header style={{ padding: '1.25rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0d0e12' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Link to="/" style={{ color: '#00E5FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1rem' }}>Dashboard</span>
        </Link>
      </div>
      <div>
        <button 
          onClick={handleCopyLink}
          className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[16px]">share</span> Copy Link
        </button>
      </div>
    </header>
  );

  return (
    <Layout 
      customHeader={customHeader}
      onNavigate={(view) => {
        if (view === 'dashboard') navigate('/');
      }}
      onNewCheck={() => navigate('/')}
    >
      <ResultDashboard
        key={id}
            lastQueryContext={q}
            report={report}
            aiDetection={aiDetection}
            isProcessing={false}
            processedClaims={processedClaims}
            claims={claims}
            chatId={id}
            onNewCheck={null}
            setToast={setToast}
            setActiveSources={setActiveSources}
          />
      
      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />

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
    </Layout>
  );
}
