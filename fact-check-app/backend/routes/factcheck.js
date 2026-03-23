require('dotenv').config();
const express              = require('express');
const router               = express.Router();
const { scrapeUrl }        = require('../services/urlScraper');
const { getCached, setCache } = require('../utils/cache');
const { extractClaims }    = require('../agents/claimExtractor');
const { retrieveEvidence } = require('../agents/evidenceRetriever');
const { verifyClaim } = require('../agents/verificationEngine');
const { generateAccuracyReport, generateInsightSummary } = require('../agents/reportGenerator');
const { detectAiText } = require('../services/aiTextDetector');

const sleep = ms => new Promise(r => setTimeout(r, ms));
function normalizeKey(text) {
  return text.toLowerCase().trim();
}

function send(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

router.post('/factcheck', async (req, res) => {
  res.setHeader('Content-Type',  'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection',    'keep-alive');
  res.flushHeaders();

  const { inputType, content } = req.body;

  try {
    // ── INIT ──
    send(res, { type: 'PIPELINE', step: 'INIT', status: 'Initializing pipeline...', progress: 0 });
    const cacheKey = normalizeKey(content);

// ⚡ CACHE CHECK
const cached = getCached(cacheKey);
if (cached) {
  console.log('[Factcheck] ⚡ Cache hit');

  send(res, {
    type: 'PIPELINE',
    step: 'CACHE',
    status: 'Using cached result...',
    progress: 100
  });

  // Send the report data from the cache entry
  send(res, {
    type: 'REPORT',
    report: cached.report
  });
  
  // Also send the shareId if available
  if (cached.id) {
    send(res, { type: 'SHARE_ID', shareId: cached.id });
  }

  return res.end();
}
    let textToProcess = content;
    let scrapedImages = [];
    let scrapedMeta   = null;

    // ── SCRAPING (URL only) ──
    if (inputType === 'url') {
      send(res, { type: 'PIPELINE', step: 'SCRAPING', status: `Scraping article from URL...`, progress: 10 });
      try {
        const scraped = await scrapeUrl(content);
        if (scraped.error || !scraped.text || scraped.text.length < 50) {
          send(res, { type: 'ERROR', message: 'Failed to scrape URL. Please check the link and try again.' });
          return res.end();
        }
        textToProcess = scraped.text;
        scrapedImages = scraped.images || [];
        scrapedMeta   = { title: scraped.title, domain: scraped.domain, imageCount: scrapedImages.length };
        send(res, { type: 'SCRAPED', title: scraped.title, domain: scraped.domain, length: scraped.text.length, imageCount: scrapedImages.length });
      } catch (scrapeErr) {
        console.error('[Factcheck] Scrape error:', scrapeErr.message);
        send(res, { type: 'ERROR', message: 'Failed to scrape URL: ' + scrapeErr.message });
        return res.end();
      }
    }

    // ── EXTRACTING ──
    send(res, { type: 'PIPELINE', step: 'EXTRACTING', status: 'Extracting atomic claims...', progress: 20 });
    let claims = [];
    try {
      claims = await extractClaims(textToProcess);
    } catch (extractErr) {
      console.error('[Factcheck] Extract error:', extractErr.message);
      send(res, { type: 'ERROR', message: 'Failed to extract claims: ' + extractErr.message });
      return res.end();
    }

    if (!claims || claims.length === 0) {
      send(res, { type: 'ERROR', message: 'No factual claims could be extracted from this content.' });
      return res.end();
    }

    send(res, { type: 'CLAIMS', claims });
    console.log(`[Factcheck] Extracted ${claims.length} claims`);

    // ── KICK OFF IMAGE ANALYSIS IN BACKGROUND ──
    let imageAnalysisPromise = null;
    if (scrapedImages.length > 0) {
      try {
        const { analyzeImageFromUrl } = require('../services/imageAnalyzer');
        imageAnalysisPromise = Promise.allSettled(
          scrapedImages.slice(0, 3).map(img =>
            analyzeImageFromUrl(img.url).then(result => ({ ...result, imageUrl: img.url, alt: img.alt }))
          )
        );
      } catch (imgErr) {
        console.warn('[Factcheck] Image analyzer not available:', imgErr.message);
      }
    }

    // ── SEARCHING + VERIFYING ──
    const verifiedClaims = [];

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      const progressSearch = Math.min(25 + Math.round(((i + 1) / claims.length) * 25), 50);
      const progressVerify = Math.min(50 + Math.round(((i + 1) / claims.length) * 35), 85);

      // Search
      send(res, { type: 'PIPELINE', step: 'SEARCHING', status: `Searching evidence for claim ${i + 1} of ${claims.length}...`, progress: progressSearch });
      let evidence = { sources: [], searchQuery: claim.claim };
      try {
        evidence = await retrieveEvidence(claim);
      } catch (searchErr) {
        console.warn(`[Factcheck] Search error for ${claim.id}:`, searchErr.message);
      }
      await sleep(300);

      // Verify
      send(res, { type: 'PIPELINE', step: 'VERIFYING', status: `Verifying claim ${i + 1} of ${claims.length}...`, progress: progressVerify });
      let result = {
        verdict: 'Unverifiable', confidenceScore: 0,
        reasoning: 'Error during verification process.',
        conflictingEvidence: false, conflictNote: null,
        temporallySensitive: false, citations: [],
      };
      try {
        result = await verifyClaim(claim, evidence.sources || []);
      } catch (verifyErr) {
        console.warn(`[Factcheck] Verify error for ${claim.id}:`, verifyErr.message);
      }
      await sleep(200);

      const verified = {
        ...claim,
        ...result,
        searchQuery: evidence.searchQuery,
        citations: result.citations?.length
          ? result.citations
          : (evidence.sources || []).slice(0, 3).map(s => ({
              url: s.url, title: s.title, relevantSnippet: s.snippet
            })),
      };

      verifiedClaims.push(verified);
      send(res, { type: 'VERIFIED_CLAIM', claim: verified });
      console.log(`[Factcheck] ${claim.id} → ${result.verdict} (${Math.round((result.confidenceScore || 0) * 100)}%)`);
    }

    // ── WAIT FOR IMAGE ANALYSIS ──
    let imageResults = [];
    if (imageAnalysisPromise) {
      try {
        send(res, { type: 'PIPELINE', step: 'VERIFYING', status: 'Finalizing image analysis...', progress: 88 });
        const settled = await imageAnalysisPromise;
        imageResults = settled
          .filter(r => r.status === 'fulfilled' && r.value && !r.value.error)
          .map(r => r.value);
        if (imageResults.length > 0) {
          send(res, { type: 'IMAGE_ANALYSIS', images: imageResults });
        }
      } catch (imgErr) {
        console.warn('[Factcheck] Image analysis error:', imgErr.message);
      }
    }

    // ── REPORT ──
    send(res, { type: 'PIPELINE', step: 'REPORTING', status: 'Generating accuracy report...', progress: 92 });

    const reportData = await generateAccuracyReport(verifiedClaims);
    const insightSummary = await generateInsightSummary(reportData);

    const report = {
      total: reportData.total_claims,
      true: reportData.true,
      partial: reportData.partial,
      false: reportData.false,
      unverifiable: reportData.not_verifiable,
      accuracyScore: reportData.confidence,
      riskLevel: (() => {
        // Map the literal "LOW", "MEDIUM", "HIGH" into the emoji-based frontend standards existing before
        if (reportData.risk_level === 'LOW') return '🟢 Low Risk';
        if (reportData.risk_level === 'MEDIUM') return '🟡 Medium Risk';
        return '🔴 High Risk';
      })(),
      insightSummary: insightSummary,
      results: verifiedClaims
    };

    console.log(`[Factcheck] Report: ${report.accuracyScore}% accuracy, ${report.riskLevel}`);
    send(res, { type: 'REPORT', report });
    try {
      const shareId = setCache(content, report);
      console.log(`[Factcheck] 💾 Cached result with ID: ${shareId}`);
      send(res, { type: 'SHARE_ID', shareId });
    } catch (cacheErr) {
      console.warn('[Factcheck] Cache save failed:', cacheErr.message);
    }
    send(res, { type: 'PIPELINE', step: 'REPORTING', status: 'Pipeline finished successfully.', progress: 100 });

  } catch (err) {
    console.error('[Factcheck] Fatal error:', err.message, err.stack);
    send(res, { type: 'ERROR', message: err.message || 'An unexpected error occurred.' });
  } finally {
    res.end();
  }
});

// ── SHARE ROUTES ──

// Get shared report by ID
router.get('/share/:id', (req, res) => {
  const { id } = req.params;
  const entry = getById(id);
  
  if (!entry) {
    return res.status(404).json({ error: 'Report not found or link expired.' });
  }
  
  res.json(entry);
});

// Register a report for sharing (if not already there)
router.post('/share', (req, res) => {
  const { query, report, id } = req.body;
  if (!query || !report) {
    return res.status(400).json({ error: 'Missing report data.' });
  }
  
  const shareId = setCache(query, report, id);
  res.json({ shareId });
});

module.exports = router;
