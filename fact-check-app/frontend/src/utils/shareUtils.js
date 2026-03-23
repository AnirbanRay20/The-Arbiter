/**
 * Encode full report data into a shareable URL hash
 * Uses base64 encoding — no backend needed, fully client-side
 */
export function encodeShareData(data) {
  try {
    const json    = JSON.stringify(data);
    const b64     = btoa(encodeURIComponent(json));
    return b64;
  } catch (e) {
    console.error('Share encode error:', e);
    return null;
  }
}

export function buildShareUrl(query, report, claims) {
  const payload = {
    query,
    report,
    claims: claims.map(c => ({
      id:                  c.id,
      claim:               c.claim,
      verdict:             c.verdict,
      confidenceScore:     c.confidenceScore,
      reasoning:           c.reasoning,
      conflictingEvidence: c.conflictingEvidence,
      conflictNote:        c.conflictNote,
      temporallySensitive: c.temporallySensitive,
      isQuestion:          c.isQuestion,
      directAnswer:        c.directAnswer,
      citations:           (c.citations || []).slice(0, 3),
    })),
    sharedAt: new Date().toISOString(),
    version:  '1.0',
  };

  const encoded = encodeShareData(payload);
  if (!encoded) return null;

  const base = window.location.origin + window.location.pathname;
  return `${base}#share=${encoded}`;
}

export function buildIdShareUrl(id) {
  const base = window.location.origin + window.location.pathname;
  return `${base}#s=${id}`;
}

export async function registerShare(query, report, claims, id = null) {
  try {
    const payload = {
      query,
      report,
      id,
      claims: (claims || []).map(c => ({
        id:                  c.id,
        claim:               c.claim,
        verdict:             c.verdict,
        confidenceScore:     c.confidenceScore,
        reasoning:           c.reasoning,
        citations:           (c.citations || []).slice(0, 3),
      })),
    };

    const res = await fetch('http://localhost:8000/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return data.shareId;
  } catch (e) {
    console.error('Failed to register share:', e);
    return null;
  }
}

export function copyShareLink(url) {
  navigator.clipboard.writeText(url);
}

export function isShareLink() {
  const hash = window.location.hash;
  return hash.startsWith('#share=') || hash.startsWith('#s=');
}

export function isIdShareLink() {
  return window.location.hash.startsWith('#s=');
}

export function getShareId() {
  const hash = window.location.hash;
  if (hash.startsWith('#s=')) return hash.slice(3);
  return null;
}
