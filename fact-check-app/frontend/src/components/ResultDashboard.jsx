import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import AccuracyReport from './AccuracyReport';
import ClaimCard from './ClaimCard';
import { AIDetectionPanel } from './AIDetectionPanel';
import URLImageAnalysisPanel from './URLImageAnalysisPanel';
import CorrectAnswerPanel from './CorrectAnswerPanel';

export default function ResultDashboard({
  lastQueryContext,
  report,
  aiDetection,
  isProcessing,
  processedClaims = [],
  claims = [],
  chatId,
  imageAnalysis,
  scrapedMeta,
  onNewCheck,
  setToast,
  setActiveSources
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isExporting, setIsExporting] = useState(false);

  const downloadPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    
    try {
      // 1. Load jspdf if needed
      if (!window.jspdf) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = resolve; script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      // 2. Load jspdf-autotable if needed
      if (!window.jspdf.jsPDF.API.autoTable) {
         await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js';
          script.onload = resolve; script.onerror = reject;
          document.head.appendChild(script);
        });
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // -- Header --
      doc.setFillColor(22, 24, 32); // #161820
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(0, 229, 255); // #00E5FF
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('THE ARBITER', 15, 20);
      
      doc.setTextColor(85, 96, 112); // #556070
      doc.setFontSize(10);
      doc.text('FORENSIC INTELLIGENCE REPORT', 15, 28);
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(`DATE: ${new Date().toLocaleString()}`, pageWidth - 15, 20, { align: 'right' });

      // -- Summary Section --
      let y = 55;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('1. SESSION INTELLIGENCE SUMMARY', 15, y);
      y += 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fact Asked:`, 15, y);
      y += 6;
      doc.setFont('helvetica', 'italic');
      doc.text(`"${lastQueryContext || 'N/A'}"`, 15, y, { maxWidth: pageWidth - 30 });
      y += 15;

      // Summary Table
      const summaryData = [
        ['Accuracy Score', `${report.accuracyScore}%`],
        ['Risk Level', report.riskLevel],
        ['Total Claims', report.total],
        ['True', report.true],
        ['Partial', report.partial],
        ['False', report.false],
        ['Unverifiable', report.unverifiable]
      ];
      
      doc.autoTable({
        startY: y,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [22, 24, 32], textColor: [0, 229, 255] },
      });
      
      y = doc.lastAutoTable.finalY + 15;

      // -- AI Detection --
      if (aiDetection) {
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('2. AI FORENSICS ANALYSIS', 15, y);
        y += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`AI Probability: ${Math.round(aiDetection.aiProbability * 100)}%`, 15, y);
        y += 6;
        doc.text(`Human Probability: ${Math.round(aiDetection.humanProbability * 100)}%`, 15, y);
        y += 8;
        doc.text(`Determination Summary:`, 15, y);
        y += 6;
        doc.setFont('helvetica', 'italic');
        doc.text(aiDetection.summary, 15, y, { maxWidth: pageWidth - 30 });
        y += 20;
      }

    // -- URL Image Analysis --
    if (imageAnalysis && imageAnalysis.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('3. SCRAPED MEDIA ANALYSIS', 15, y);
      y += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Detected ${imageAnalysis.length} images from ${scrapedMeta?.domain || 'source'}.`, 15, y);
      y += 8;
      
      const imageData = imageAnalysis.map((img, i) => [
        i + 1,
        img.alt || 'No description',
        img.aiProbability > 0.5 ? 'AI GENERATED' : 'PROBABLY HUMAN',
        `${Math.round(img.aiProbability * 100)}%`
      ]);

      doc.autoTable({
        startY: y,
        head: [['#', 'Description', 'AI Detection', 'Confidence']],
        body: imageData,
        theme: 'grid',
        headStyles: { fillColor: [22, 24, 32], textColor: [255, 171, 0] }, // Amber for media
        styles: { fontSize: 8 },
      });
      y = doc.lastAutoTable.finalY + 15;
    }

    // -- Detailed Claims --
    if (y > 220) { doc.addPage(); y = 20; }
    else { y += 5; }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${imageAnalysis ? '4' : '3'}. DETAILED VERIFICATION STREAM`, 15, y);
    y += 10;

      const claimsData = processedClaims.map(c => [
        c.id,
        c.claim,
        c.verdict.toUpperCase(),
        `${Math.round(c.confidenceScore * 100)}%`,
        c.reasoning
      ]);

      doc.autoTable({
        startY: y,
        head: [['ID', 'Claim', 'Verdict', 'Conf.', 'Reasoning']],
        body: claimsData,
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 45 },
          2: { cellWidth: 25 },
          3: { cellWidth: 12 },
          4: { cellWidth: 'auto' }
        },
        headStyles: { fillColor: [22, 24, 32], textColor: [0, 229, 255] },
        styles: { fontSize: 8 },
      });

      doc.save(`arbiter_report_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('PDF generation failed. Check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const filterCategories = ['All', 'Tech', 'Science', 'Business'];

  const filteredClaims = processedClaims.filter(c => {
    const text = (c.claim + ' ' + (c.reasoning || '')).toLowerCase();
    if (!text.includes(searchQuery.toLowerCase())) return false;
    if (activeCategory === 'All') return true;
    if (activeCategory === 'Tech') return text.includes('tech') || text.includes('software') || text.includes('ai') || text.includes('digital') || text.includes('data');
    if (activeCategory === 'Science') return text.includes('science') || text.includes('research') || text.includes('study') || text.includes('physics') || text.includes('medical') || text.includes('health');
    if (activeCategory === 'Business') return text.includes('business') || text.includes('market') || text.includes('company') || text.includes('finance') || text.includes('stock');
    return true;
  });

  const visibleClaims = filteredClaims.slice(0, visibleCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ── FACT ASKED HEADER ── */}
      {lastQueryContext && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            padding: '1rem 1.25rem',
            backgroundColor: '#161820',
            border: '1px solid rgba(255,255,255,0.06)',
            borderLeft: '3px solid #00E5FF',
            borderRadius: 8,
          }}
        >
          {/* Icon */}
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#00E5FF', marginTop: 2, flexShrink: 0 }}>fact_check</span>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#556070', display: 'block', marginBottom: 6 }}>
              Fact Asked
            </span>
            <p style={{
              fontFamily: 'Manrope', fontWeight: 500, fontSize: 14,
              color: '#e3e2e8', lineHeight: 1.5, margin: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              "{lastQueryContext}"
            </p>
          </div>

          {/* Timestamp */}
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', flexShrink: 0, alignSelf: 'center' }}>
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </motion.div>
      )}

      {/* STEP 2 — Session Intelligence Report */}
      {report && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{
            backgroundColor: '#161820',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <AccuracyReport
              report={report}
              onNewCheck={onNewCheck}
              onShare={chatId ? () => { navigator.clipboard.writeText(`${window.location.origin}/chat/${chatId}`); setToast('Link copied successfully'); setTimeout(() => setToast(null), 3000); } : null}
              onPDF={downloadPDF}
            />
          </div>
        </motion.div>
      )}

      {/* STEP 3 — AI Detection Panel */}
      {report && aiDetection && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <AIDetectionPanel detectionResult={aiDetection} />
        </motion.div>
      )}

      {/* STEP 3b — URL Image Analysis */}
      {report && imageAnalysis && imageAnalysis.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <URLImageAnalysisPanel
            images={imageAnalysis}
            domain={scrapedMeta?.domain}
          />
        </motion.div>
      )}

      {/* STEP 4 — Correct Answers Panel (for False/Partial claims) */}
      {report && processedClaims.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <CorrectAnswerPanel processedClaims={processedClaims} />
        </motion.div>
      )}

      {/* STEP 5 — Verified Claims Feed */}
      {processedClaims.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(186,201,204,0.5)' }}>
              Verified Claims Stream
            </span>
            {isProcessing && (
              <span className="animate-pulse" style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Live Stream
              </span>
            )}
          </div>

          {/* Filters + Search */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', backgroundColor: '#161820', padding: 4, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)', gap: 2 }}>
              {filterCategories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  padding: '0.35rem 0.9rem', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 10,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  backgroundColor: activeCategory === cat ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: activeCategory === cat ? '#e3e2e8' : '#556070',
                  transition: 'all 0.15s',
                }}>
                  {cat}
                </button>
              ))}
            </div>
            <div style={{ position: 'relative', width: 220 }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: '#556070' }}>search</span>
              <input
                type="text" placeholder="Search claims..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ width: '100%', backgroundColor: '#161820', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '0.45rem 0.75rem 0.45rem 2rem', fontFamily: 'Manrope', fontSize: 12, color: '#e3e2e8', outline: 'none' }}
              />
            </div>
          </div>

          {/* Claims grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '1rem' }}>
            <AnimatePresence>
              {visibleClaims.map(c => (
                <ClaimCard key={c.id} claimData={c} onViewSources={citations => setActiveSources(citations)} />
              ))}
            </AnimatePresence>
          </div>

          {/* Processing indicator */}
          {isProcessing && claims.length > processedClaims.length && (
            <p className="animate-pulse" style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '1.5rem 0' }}>
              Processing {claims.length - processedClaims.length} remaining claims...
            </p>
          )}

          {/* Load more */}
          {!isProcessing && visibleCount < filteredClaims.length && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
              <button onClick={() => setVisibleCount(v => v + 6)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.6rem 1.75rem', backgroundColor: '#161820',
                border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8,
                color: '#bac9cc', cursor: 'pointer',
                fontFamily: 'Space Grotesk', fontWeight: 700,
                fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Load More
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>expand_more</span>
              </button>
            </div>
          )}

          {/* No results */}
          {!isProcessing && filteredClaims.length === 0 && processedClaims.length > 0 && (
            <p style={{ textAlign: 'center', fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#556070', textTransform: 'uppercase', padding: '2rem 0' }}>
              No claims match your filters.
            </p>
          )}


          {/* Bottom Action Bar (Download PDF) */}
          {!isProcessing && processedClaims.length > 0 && (
            <div style={{ 
              display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', 
              paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' 
            }}>
              <button 
                onClick={downloadPDF}
                disabled={isExporting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.85rem 1.75rem',
                  backgroundColor: 'rgba(255,61,87,0.08)', border: '1px solid rgba(255,61,87,0.25)',
                  color: '#FF3D57', borderRadius: 10, cursor: isExporting ? 'not-allowed' : 'pointer',
                  fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13,
                  textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'all 0.2s',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)', opacity: isExporting ? 0.6 : 1,
                  position: 'relative', overflow: 'hidden'
                }}
                onMouseEnter={e => !isExporting && (e.currentTarget.style.backgroundColor = 'rgba(255,61,87,0.15)')}
                onMouseLeave={e => !isExporting && (e.currentTarget.style.backgroundColor = 'rgba(255,61,87,0.08)')}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>picture_as_pdf</span>
                {isExporting ? 'Generating Forensic Report...' : 'Download Full PDF Report'}
                
                {/* Visual accent */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#FF3D57' }} />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
