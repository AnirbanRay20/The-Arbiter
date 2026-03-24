require('dotenv').config();
const express              = require('express');
const router               = express.Router();
const { scrapeUrl }        = require('../services/urlScraper');
const { UNIFIED_FACT_CHECK_PROMPT } = require('../utils/prompts');
const Groq                 = require('groq-sdk');
const { getById, saveReport } = require('../utils/storage');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
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

    // ── UNIFIED FACT CHECK (LLM PASS) ──
    send(res, { type: 'PIPELINE', step: 'VERIFYING', status: 'Running Unified Fact-Checking Engine...', progress: 40 });
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant', // or any available fast model
      temperature: 0.1,
      messages: [
        { role: 'system', content: UNIFIED_FACT_CHECK_PROMPT },
        { role: 'user', content: `INPUT:\n${textToProcess.slice(0, 6000)}` } // trim to avoid token overflow
      ],
      response_format: { type: 'json_object' } // Always return valid JSON per new prompt rules
    });

    const rawResponse = completion.choices[0]?.message?.content || '';

    // Error handling & fallback checking
    let parsed;
    try {
      const start = rawResponse.indexOf('{');
      const end = rawResponse.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(rawResponse.slice(start, end + 1));
      } else {
        parsed = JSON.parse(rawResponse);
      }
    } catch (e) {
      console.error("[Factcheck] LLM did not return valid JSON.", rawResponse.slice(0, 200));
      send(res, { type: 'ERROR', message: 'Engine returned invalid structure or no verifiable claims found.' });
      return res.end();
    }

    const claims = parsed.claims || [];
    if (claims.length === 0 || (parsed.summary && parsed.summary.message && parsed.summary.message.includes("No verifiable claims"))) {
      send(res, { type: 'ERROR', message: 'No verifiable claims found in the provided input.' });
      return res.end();
    }

    // Send original claims up
    send(res, { type: 'PIPELINE', step: 'VERIFYING', status: `Mapped ${claims.length} claims. Formatting feed...`, progress: 80 });
    send(res, { type: 'CLAIMS', claims: claims.map((c, i) => ({ id: `C${i+1}`, claim: c.claim })) });

    const verifiedClaims = [];
    for (let i = 0; i < claims.length; i++) {
       const mapped = claims[i];
       
       // Strict frontend mapping for Verdict UI compatibility
       let mappedVerdict = "Unverifiable";
       if (mapped.status === "Verified") mappedVerdict = "True";
       else if (mapped.status === "False") mappedVerdict = "False";
       else if (mapped.status === "Partially True") mappedVerdict = "Partially True";

       const formattedClaim = {
         id: `C${i+1}`,
         claim: mapped.claim,
         verdict: mappedVerdict,
         confidenceScore: (mapped.confidence || 0) / 100, // Dashboard expects 0.0 - 1.0 interval
         reasoning: mapped.explanation,
         temporallySensitive: mapped.type === "Time-sensitive" || (mapped.explanation && mapped.explanation.includes("Checked as of")),
         citations: [] // Unified prompt lacks multi-agent citation mechanism
       };
       verifiedClaims.push(formattedClaim);
       
       send(res, { type: 'VERIFIED_CLAIM', claim: formattedClaim });
       await sleep(150); // Simulate stream entry for animation
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

    const totalValue = Number(parsed.summary?.total_claims ?? verifiedClaims.length) || 0;
    const trueValue = Number(parsed.summary?.verified ?? verifiedClaims.filter(c => c.verdict === 'True').length) || 0;
    const falseValue = Number(parsed.summary?.false ?? verifiedClaims.filter(c => c.verdict === 'False').length) || 0;
    const partialValue = Number(parsed.summary?.partial ?? verifiedClaims.filter(c => c.verdict === 'Partially True').length) || 0;
    const unverifiableValue = verifiedClaims.filter(c => c.verdict === 'Unverifiable').length;

    const report = {
      total: totalValue,
      true: trueValue,
      false: falseValue,
      partial: partialValue,
      unverifiable: unverifiableValue,
      accuracyScore: totalValue > 0 ? Math.round(((trueValue + (partialValue * 0.5)) / totalValue) * 100) : 0,
      riskLevel: 'Medium Risk'
    };
    
    // Compute Risk Level dynamically
    if (report.accuracyScore >= 70) report.riskLevel = 'Low Risk';
    else if (report.accuracyScore < 40) report.riskLevel = 'High Risk';

    console.log(`[Factcheck] Unified Report: ${report.accuracyScore}% accuracy, ${report.riskLevel}`);
    send(res, { type: 'REPORT', report });
    
    // Save for History & Sharing
    try {
      const shareId = saveReport(content, report);
      console.log(`[Factcheck] 💾 Saved result for sharing with ID: ${shareId}`);
      send(res, { type: 'SHARE_ID', shareId });
    } catch (storeErr) {
      console.warn('[Factcheck] Storage failed:', storeErr.message);
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

// Register a report for sharing
router.post('/share', (req, res) => {
  const { query, report, id } = req.body;
  if (!query || !report) {
    return res.status(400).json({ error: 'Missing report data.' });
  }
  
  const shareId = saveReport(query, report, id);
  res.json({ shareId });
});

module.exports = router;
