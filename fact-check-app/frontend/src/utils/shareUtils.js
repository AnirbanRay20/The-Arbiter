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

export function copyShareLink(url) {
  navigator.clipboard.writeText(url);
}

export function isShareLink() {
  return window.location.hash.startsWith('#share=');
}
