require('dotenv').config();
const express              = require('express');
const router               = express.Router();
const { scrapeUrl }        = require('../services/urlScraper');
const { extractClaims }    = require('../agents/claimExtractor');
const { retrieveEvidence } = require('../agents/evidenceRetriever');
const { verifyClaim }      = require('../agents/verificationEngine');
const { detectAiText }     = require('../services/aiTextDetector');

const sleep = ms => new Promise(r => setTimeout(r, ms));

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

    // ── MATH / CODE DETECTOR — handle before LLM ──
    const mathRegex = /^[\d\s\+\-\*\/\^\(\)\=\%\.]+$/;
    const isMathOnly = mathRegex.test(textToProcess.trim()) && textToProcess.trim().length < 50;
    if (isMathOnly) {
      try {
        // Safely evaluate math expression
        const expr    = textToProcess.trim().replace(/\^/g, '**');
        // Check if it's an equation (has =)
        if (expr.includes('=')) {
          const parts  = expr.split('=');
          const left   = Function('"use strict"; return (' + parts[0] + ')')();
          const right  = Function('"use strict"; return (' + parts[1] + ')')();
          const isTrue = Math.abs(left - right) < 0.0001;
          const claim  = { id: 'C1', claim: textToProcess.trim(), isQuestion: false };
          const result = {
            ...claim,
            verdict:         isTrue ? 'True' : 'False',
            confidenceScore: 1.0,
            reasoning:       `Mathematical evaluation: ${parts[0].trim()} = ${left}, right side = ${right}. This is mathematically ${isTrue ? 'correct' : 'incorrect'}.`,
            conflictingEvidence: false, conflictNote: null,
            temporallySensitive: false, citations: [],
          };
          send(res, { type: 'CLAIMS',        claims: [claim] });
          send(res, { type: 'VERIFIED_CLAIM', claim: result  });
          const report = {
            total: 1,
            true:  isTrue ? 1 : 0, false: isTrue ? 0 : 1,
            partial: 0, unverifiable: 0,
            accuracyScore: isTrue ? 100 : 0,
            riskLevel:     isTrue ? 'Low Risk' : 'High Risk',
          };
          send(res, { type: 'REPORT',    report });
          send(res, { type: 'PIPELINE',  step: 'REPORTING', status: 'Pipeline finished successfully.', progress: 100 });
          return res.end();
        }
      } catch (mathErr) {
        console.log('[Factcheck] Math eval failed, proceeding normally');
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

    const trueCount    = verifiedClaims.filter(c => c.verdict === 'True').length;
    const falseCount   = verifiedClaims.filter(c => c.verdict === 'False').length;
    const partialCount = verifiedClaims.filter(c => c.verdict === 'Partially True').length;
    const unknownCount = verifiedClaims.filter(c => c.verdict === 'Unverifiable').length;
    const total        = verifiedClaims.length;
    const accuracyScore = total > 0
      ? Math.round(((trueCount + partialCount * 0.5) / total) * 100)
      : 0;
    const riskLevel = accuracyScore >= 70 ? 'Low Risk'
                    : accuracyScore >= 40 ? 'Medium Risk'
                    : 'High Risk';

    const report = {
      total,
      true:         trueCount,
      false:        falseCount,
      partial:      partialCount,
      unverifiable: unknownCount,
      accuracyScore,
      riskLevel,
    };

    console.log(`[Factcheck] Report: ${accuracyScore}% accuracy, ${riskLevel}`);
    send(res, { type: 'REPORT', report });
    send(res, { type: 'PIPELINE', step: 'REPORTING', status: 'Pipeline finished successfully.', progress: 100 });

  } catch (err) {
    console.error('[Factcheck] Fatal error:', err.message, err.stack);
    send(res, { type: 'ERROR', message: err.message || 'An unexpected error occurred.' });
  } finally {
    res.end();
  }
});

module.exports = router;
