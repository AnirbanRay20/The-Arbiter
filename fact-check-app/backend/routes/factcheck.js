const express = require('express');
const router = express.Router();
const { scrapeUrlContent } = require('../services/urlScraper');
const { extractClaims } = require('../agents/claimExtractor');
const { retrieveEvidence } = require('../agents/evidenceRetriever');
const { verifyClaim } = require('../agents/verificationEngine');

router.post('/factcheck', async (req, res) => {
  const { inputType, content } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    send({ step: 'INIT', status: 'in_progress', progress: 'Starting pipeline...', data: {} });

    // URL scraping
    let textContent = content;
    if (inputType === 'url') {
      send({ step: 'SCRAPING', status: 'in_progress', progress: 'Extracting content from URL...', data: {} });
      const scraped = await scrapeUrlContent(content);
      if (!scraped) {
        send({ step: 'SCRAPING', status: 'error', progress: 'Unable to extract content from URL. Please paste the text directly.', data: {} });
        res.end();
        return;
      }
      textContent = scraped;
    }

    // STEP 1: EXTRACTING
    send({ step: 'EXTRACTING', status: 'in_progress', progress: 'Decomposing input into claims...', data: {} });
    await new Promise(r => setTimeout(r, 500));
    
    // Smart Input Handling
    const lowerInput = textContent.trim().toLowerCase();
    if (['hello', 'hi', 'test'].includes(lowerInput) || lowerInput.split(' ').length <= 1) {
      textContent = "User input is not a factual claim";
    }

    let claims = await extractClaims(textContent);

    if (!claims || claims.length === 0) {
      claims = [{
        id: `C_${Date.now()}`,
        claim: textContent,
        context: textContent
      }];
    }

    console.log("Extracted Claims:", claims);

    send({ step: 'EXTRACTING', status: 'complete', progress: `Found ${claims.length} claims.`, data: { claims } });

    // STEPS 2 & 3: SEARCHING & VERIFYING
    const processedClaims = [];

    for (let i = 0; i < claims.length; i++) {
      const claim = claims[i];
      const claimId = claim.id;

      // Searching
      send({ step: 'SEARCHING', status: 'in_progress', progress: `Searching evidence (${i + 1}/${claims.length})`, data: { currentClaimId: claimId } });
      const evidence = await retrieveEvidence(claim);

      // Verifying
      send({ step: 'VERIFYING', status: 'in_progress', progress: `Evaluating claim (${i + 1}/${claims.length})`, data: { currentClaimId: claimId } });
      const verificationResult = await verifyClaim(claim.claim, evidence);

      // Merge results
      const resultBundle = {
        id: claimId,
        claim: claim.claim,
        context: claim.context,
        searchQuery: evidence.searchQuery,
        ...verificationResult
      };
      processedClaims.push(resultBundle);

      send({ step: 'VERIFYING', status: 'claim_complete', progress: `Verified ${i + 1}/${claims.length}`, data: { claimResult: resultBundle } });
    }

    // STEP 4: REPORTING
    send({ step: 'REPORTING', status: 'in_progress', progress: 'Generating accuracy report...', data: {} });

    const total = processedClaims.length;
    const trueCount = processedClaims.filter(c => c.verdict === 'True').length;
    const partialCount = processedClaims.filter(c => c.verdict === 'Partially True').length;
    const falseCount = processedClaims.filter(c => c.verdict === 'False').length;
    const unverifiableCount = processedClaims.filter(c => c.verdict === 'Unverifiable').length;

    const accuracyScore = total > 0 ? ((trueCount + partialCount * 0.5) / total * 100) : 0;

    let riskLevel;
    if ((trueCount + partialCount) / total >= 0.8) riskLevel = '🟢 Low Risk';
    else if ((trueCount + partialCount) / total >= 0.5) riskLevel = '🟡 Medium Risk';
    else if (unverifiableCount > total / 2) riskLevel = '⚪ Insufficient Evidence';
    else riskLevel = '🔴 High Risk';

    const report = {
      total,
      true: trueCount,
      partial: partialCount,
      false: falseCount,
      unverifiable: unverifiableCount,
      accuracyScore: Math.round(accuracyScore * 10) / 10,
      riskLevel,
      results: processedClaims
    };

    send({ step: 'REPORTING', status: 'complete', progress: 'Pipeline finished successfully.', data: { report } });

  } catch (err) {
    console.error('Pipeline error:', err);
    send({ step: 'ERROR', status: 'error', progress: `Unexpected error: ${err.message}`, data: {} });
  } finally {
    res.end();
  }
});

module.exports = router;
