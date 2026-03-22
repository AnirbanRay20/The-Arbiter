import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageAnalysisPanel({ onAnalyze, isAnalyzing, result }) {
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl]   = useState('');
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'url'
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleAnalyze = () => {
    if (inputMode === 'upload' && imageFile) {
      onAnalyze({ type: 'file', file: imageFile, preview });
    } else if (inputMode === 'url' && imageUrl) {
      onAnalyze({ type: 'url', url: imageUrl });
    }
  };

  const canAnalyze = (inputMode === 'upload' && imageFile) || (inputMode === 'url' && imageUrl.trim().length > 5);

  const reset = () => {
    setPreview(null);
    setImageFile(null);
    setImageUrl('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Input mode tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 4, backgroundColor: '#0d0e12', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
        {[
          { id: 'upload', icon: 'upload',     label: 'Upload Image' },
          { id: 'url',    icon: 'link',        label: 'Image URL'   },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setInputMode(tab.id); reset(); }} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.45rem 1rem', borderRadius: 6, border: 'none', cursor: 'pointer',
            fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 11,
            textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.15s',
            backgroundColor: inputMode === tab.id ? 'rgba(0,229,255,0.1)' : 'transparent',
            color: inputMode === tab.id ? '#00E5FF' : '#556070',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Upload mode */}
        {inputMode === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {!preview ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#00E5FF' : 'rgba(59,73,76,0.5)'}`,
                  borderRadius: 10,
                  padding: '3rem 2rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '0.75rem', cursor: 'pointer', transition: 'all 0.2s',
                  backgroundColor: dragOver ? 'rgba(0,229,255,0.04)' : 'rgba(255,255,255,0.02)',
                  minHeight: 180,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 40, color: dragOver ? '#00E5FF' : '#556070' }}>
                  add_photo_alternate
                </span>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: 'Space Grotesk', fontWeight: 600, fontSize: 14, color: '#e3e2e8', margin: '0 0 4px' }}>
                    Drop image here or click to browse
                  </p>
                  <p style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                    JPG, PNG, WEBP, GIF · Max 10MB
                  </p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              </div>
            ) : (
              <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <img src={preview} alt="Preview" style={{ width: '100%', maxHeight: 320, objectFit: 'contain', backgroundColor: '#0d0e12', display: 'block' }} />
                <button
                  onClick={reset}
                  style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 28, height: 28, borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#bac9cc',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
                <div style={{ padding: '0.6rem 0.9rem', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#00E5FF' }}>image</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#bac9cc' }}>{imageFile?.name}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#556070', marginLeft: 'auto' }}>
                    {imageFile ? (imageFile.size / 1024).toFixed(0) + ' KB' : ''}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* URL mode */}
        {inputMode === 'url' && (
          <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.9rem 1rem', backgroundColor: '#161820', border: '1px solid rgba(59,73,76,0.4)', borderRadius: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#556070', flexShrink: 0 }}>link</span>
              <input
                type="url"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#e3e2e8',
                }}
              />
              {imageUrl && (
                <button onClick={() => setImageUrl('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556070', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!canAnalyze || isAnalyzing}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '0.7rem 1.5rem', borderRadius: 999, border: 'none', cursor: canAnalyze && !isAnalyzing ? 'pointer' : 'not-allowed',
          backgroundColor: canAnalyze && !isAnalyzing ? '#00E5FF' : 'rgba(255,255,255,0.04)',
          color: canAnalyze && !isAnalyzing ? '#00363d' : '#556070',
          fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 12,
          textTransform: 'uppercase', letterSpacing: '0.1em',
          boxShadow: canAnalyze && !isAnalyzing ? '0 0 18px rgba(0,229,255,0.3)' : 'none',
          transition: 'all 0.2s', alignSelf: 'flex-start',
        }}
      >
        {isAnalyzing ? (
          <>
            <span style={{ width: 14, height: 14, border: '2px solid #00363d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Analyzing Image...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>image_search</span>
            Analyze Image
          </>
        )}
      </button>

      {/* Result */}
      <AnimatePresence>
        {result && <ImageResult result={result} preview={preview} imageUrl={imageUrl} />}
      </AnimatePresence>
    </div>
  );
}

/* ── Result display ── */
function ImageResult({ result, preview, imageUrl }) {
  const { aiProbability, verdict, confidence, signals, explanation, metadata } = result;
  const pct = Math.round((aiProbability || 0) * 100);

  const isAI    = pct > 70;
  const isMixed = pct > 40 && pct <= 70;
  const color   = isAI ? '#FF3D57' : isMixed ? '#FFAB00' : '#00E5FF';
  const label   = isAI ? 'AI Generated / Deepfake' : isMixed ? 'Uncertain Origin' : 'Likely Authentic';
  const icon    = isAI ? 'warning' : isMixed ? 'help' : 'verified';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      style={{
        backgroundColor: '#161820',
        border: `1px solid ${color}25`,
        borderTop: `3px solid ${color}`,
        borderRadius: 10, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: '#e3e2e8' }}>{label}</span>
        </div>
        <span style={{
          fontFamily: 'IBM Plex Mono', fontSize: 11, fontWeight: 700,
          padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase',
          color, backgroundColor: `${color}12`, border: `1px solid ${color}30`,
        }}>
          {pct}% AI Score
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: preview ? '200px 1fr' : '1fr', gap: 0 }}>

        {/* Image preview */}
        {(preview || imageUrl) && (
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d0e12' }}>
            <img
              src={preview || imageUrl}
              alt="Analyzed"
              style={{ maxWidth: '100%', maxHeight: 160, objectFit: 'contain', borderRadius: 6 }}
            />
          </div>
        )}

        {/* Analysis */}
        <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Confidence bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>AI Probability</span>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Authentic Probability</span>
            </div>
            <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', backgroundColor: color }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${100 - pct}%` }} transition={{ duration: 0.8 }} style={{ height: '100%', backgroundColor: '#00E5FF', opacity: 0.3 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color }}>{pct}%</span>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 13, color: '#00E5FF' }}>{100 - pct}%</span>
            </div>
          </div>

          {/* Explanation */}
          {explanation && (
            <p style={{ fontFamily: 'Manrope', fontSize: 13, color: '#bac9cc', lineHeight: 1.6, margin: 0 }}>
              {explanation}
            </p>
          )}

          {/* Signals */}
          {signals?.length > 0 && (
            <div>
              <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 9, color: '#556070', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>
                Detected Signals
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {signals.map((s, i) => (
                  <span key={i} style={{
                    padding: '3px 9px', borderRadius: 999,
                    backgroundColor: `${color}08`, border: `1px solid ${color}20`,
                    fontFamily: 'IBM Plex Mono', fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
