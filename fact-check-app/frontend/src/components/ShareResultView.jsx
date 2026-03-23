import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AccuracyReport from './AccuracyReport';
import ClaimCard from './ClaimCard';
import CorrectAnswerPanel from './CorrectAnswerPanel';

// Decode shared data from URL hash
function decodeShareData(hash) {
  try {
    const b64 = hash.startsWith('#share=') ? hash.slice(7) : hash.slice(1);
    const json = atob(decodeURIComponent(b64));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function ShareResultView({ onGoToDashboard }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleDashboardReturn = () => {
    if (onGoToDashboard) onGoToDashboard();
    else navigate('/');
  };

  const [data, setData]     = useState(null);
  const [error, setError]   = useState(false);
  const [activeSources, setActiveSources] = useState([]);

  useEffect(() => {
    console.log("Share ID:", id);
    
    // 5. Fix Data Access 
    const chats = JSON.parse(localStorage.getItem('arbiter_history') || '[]');
    const session = chats.find(c => String(c.id) === String(id));
    console.log("Session:", session);

    // 6. Add Safe Rendering / Fallback Check
    if (session) {
      const results = session?.result?.results || session?.claims || [];
      setData({
        query: session.q || session.text,
        report: session.report || session.result,
        claims: results,
        sharedAt: session.date || new Date().toISOString()
      });
    } else {
      // API fallback just in case
      fetch(`http://localhost:8000/api/share/${id}`)
        .then(res => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then(resData => {
          setData({
            query: resData.q || resData.query,
            report: resData.report,
            claims: resData.report?.results || [],
            sharedAt: resData.timestamp
          });
        })
        .catch(err => {
          console.error('Fetch shared report error:', err);
          setError(true);
        });
    }
  }, [id]);

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#FF3D57' }}>link_off</span>
      <p style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: '#e3e2e8' }}>No shared data found</p>
      <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070' }}>This share link could not be decoded.</p>
      <button onClick={handleDashboardReturn} style={{ padding: '0.6rem 1.5rem', backgroundColor: '#00E5FF', color: '#00363d', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Go to Dashboard
      </button>
    </div>
  );

  if (!data) return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#556070', fontFamily: 'IBM Plex Mono' }}>Loading Analysis Report...</div>;

  return (
    <div className="page-scroll" style={{ height: '100vh', width: '100%', overflowY: 'auto', backgroundColor: '#0d0e12', scrollBehavior: 'smooth' }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>

      {/* Shared report banner */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.25rem', backgroundColor: 'rgba(13, 14, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,255,0.2)', flexWrap: 'wrap', gap: 8,
        margin: '-2rem -1.5rem 1.5rem', /* negate outer padding for edge-to-edge sticky */
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#00E5FF' }}>share</span>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Shared Forensic Report
          </span>
          {data.sharedAt && (
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070' }}>
              · Generated {new Date(data.sharedAt).toLocaleString()}
            </span>
          )}
        </div>
        <button onClick={handleDashboardReturn} style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '0.4rem 1rem', backgroundColor: '#00E5FF', color: '#00363d',
          border: 'none', borderRadius: 999, cursor: 'pointer',
          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          New Check
        </button>
      </div>

      {/* Fact Asked */}
      {data.query && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          padding: '1rem 1.25rem', backgroundColor: '#161820',
          border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #00E5FF', borderRadius: 8,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', marginTop: 2, flexShrink: 0 }}>fact_check</span>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#556070', display: 'block', marginBottom: 6 }}>
              Fact Checked
            </span>
            <p style={{ fontFamily: 'Manrope', fontWeight: 500, fontSize: 14, color: '#e3e2e8', lineHeight: 1.5, margin: 0 }}>
              "{data.query}"
            </p>
          </div>
        </div>
      )}

      {/* Accuracy Report */}
      {data.report && (
        <div style={{ backgroundColor: '#161820', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
          <AccuracyReport report={data.report} onNewCheck={handleDashboardReturn} />
        </div>
      )}

      {/* Correct Answers */}
      {data.claims?.length > 0 && (
        <CorrectAnswerPanel processedClaims={data.claims} />
      )}

      {/* Claims */}
      {data.claims?.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070' }}>verified</span>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
              Verified Claims — {data.claims.length} total
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
            {data.claims.map(c => (
              <ClaimCard key={c.id} claimData={c} onViewSources={setActiveSources} />
            ))}
          </div>
        </div>
      )}

      {/* Powered by footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#556070', fontVariationSettings: "'FILL' 1" }}>shield</span>
        <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Verified by The Arbiter · Forensic Intelligence System
        </span>
      </div>
      </motion.div>
    </div>
  );
}
