import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AccuracyReport from './AccuracyReport';
import ClaimCard from './ClaimCard';
import { AIDetectionPanel } from './AIDetectionPanel';
import { EvidenceDrawer } from './EvidenceDrawer';

export default function ChatView() {
  const { id } = useParams();
  const [chatData, setChatData] = useState(null);
  const [activeSources, setActiveSources] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const data = localStorage.getItem(`chat_${id}`);
      if (!data) {
        console.log("Missing:", "chat_" + id);
        setChatData({ error: 'Chat not found or not saved' });
        return;
      }
      
      const parsedData = JSON.parse(data);
      if (!parsedData || Object.keys(parsedData).length === 0) {
        console.log("Missing:", "chat_" + id);
        setChatData({ error: 'Chat not found or not saved' });
        return;
      }
      
      setChatData(parsedData);
    } catch (e) {
      console.log("Missing:", "chat_" + id);
      setChatData({ error: 'Chat not found or not saved' });
    }
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
  const filterCategories = ['All', 'Tech', 'Science', 'Business'];

  const filteredClaims = processedClaims.filter(c => {
    const text = (c.claim + ' ' + (c.reasoning || '')).toLowerCase();
    const queryMatch = text.includes(searchQuery.toLowerCase());
    if (!queryMatch) return false;
    
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Tech') return text.includes('tech') || text.includes('software') || text.includes('ai') || text.includes('app') || text.includes('digital') || text.includes('data');
    if (activeCategory === 'Science') return text.includes('science') || text.includes('research') || text.includes('study') || text.includes('physics') || text.includes('medical') || text.includes('health');
    if (activeCategory === 'Business') return text.includes('business') || text.includes('market') || text.includes('company') || text.includes('finance') || text.includes('stock') || text.includes('economy');
    return true;
  });

  const visibleClaims = filteredClaims.slice(0, visibleCount);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/chat/${id}`);
    setToast('Link copied successfully');
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#121317', flexDirection: 'column' }}>
      {/* TopBar-ish Header */}
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

      <main className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#0d0e12' }}>
        <div className="max-w-5xl mx-auto px-6 py-10 pb-32">
          
          <div className="mb-10 p-6 bg-[#161820] rounded-xl border border-white/5">
            <h2 className="text-gray-400 font-mono text-xs uppercase tracking-widest mb-2">Original Query</h2>
            <p className="text-gray-200 font-medium text-lg" style={{ fontFamily: 'Manrope' }}>{q}</p>
          </div>

          <div className="space-y-8">
            {report && aiDetection && (
              <div className="mb-12">
                <AIDetectionPanel detectionResult={aiDetection} />
              </div>
            )}

            <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                Shared Intelligence Report
              </span>
            </div>

            {report && (
              <div className="bg-[#161820] rounded-2xl border border-white/5 overflow-hidden shadow-2xl mb-8">
                <AccuracyReport report={report} />
              </div>
            )}

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
               <div className="flex bg-[#161820] p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
                 {filterCategories.map(cat => (
                   <button 
                     key={cat} 
                     onClick={() => setActiveCategory(cat)}
                     className={`px-4 sm:px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
               <div className="relative w-full md:w-72 shrink-0">
                 <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[18px]">search</span>
                 <input 
                   type="text" 
                   placeholder="Search claims..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full bg-[#161820] border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                 />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
              {visibleClaims.map((c) => (
                <ClaimCard 
                  key={c.id} 
                  claimData={c}
                  onViewSources={(citations) => setActiveSources(citations)} 
                />
              ))}
            </div>

            {visibleCount < filteredClaims.length && (
              <div className="flex justify-center mt-10">
                <button 
                  onClick={() => setVisibleCount(v => v + 6)}
                  className="px-8 py-3 bg-[#161820] border border-white/5 hover:border-white/10 hover:bg-[#1a1c25] rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 transition-all flex items-center gap-2 group"
                >
                  Load More Results
                  <span className="material-symbols-outlined text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </button>
              </div>
            )}
            
            {filteredClaims.length === 0 && processedClaims.length > 0 && (
              <div className="text-center py-10">
                <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">No claims match your filters.</p>
              </div>
            )}

          </div>
        </div>
      </main>

      <EvidenceDrawer citations={activeSources} onClose={() => setActiveSources([])} />

      {/* Toast Notification */}
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
    </div>
  );
}
