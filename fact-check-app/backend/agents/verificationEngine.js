require('dotenv').config();
const Groq = require('groq-sdk');
const { VERIFICATION_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function verifyClaim(claim, sources) {
  sources = sources || [];

  if (!sources.length) {
    return {
      verdict: 'Unverifiable',
      confidenceScore: 0.0,
      reasoning: 'No evidence found for this claim.',
      conflictingEvidence: false,
      conflictNote: null,
      temporallySensitive: false,
      citations: []
    };
  }

  // Format evidence
  let evidenceStr = '';
  sources.forEach((s, idx) => {
    evidenceStr += `[${idx + 1}] Source: ${s.title} (${s.url})\nSnippet: ${s.snippet}\n\n`;
  });

  const claimMetadata = {
    claimId: claim.id,
    claim: claim.claim,
    isQuestion: claim.isQuestion || false
  };

  const userPrompt = `CLAIM DATA:\n${JSON.stringify(claimMetadata, null, 2)}\n\nEVIDENCE:\n${evidenceStr}\nNow reason step-by-step and evaluate the claim against this evidence only.\nBefore finalising, ask yourself: am I using internal knowledge? If yes, mark Unverifiable.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    });

    const content = response.choices[0]?.message?.content || '';

    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(content.slice(start, end + 1));
      
      const v = (parsed.verdict || 'Unverifiable').toLowerCase();
      let verdict = 'Unverifiable';
      if (v.includes('partially')) verdict = 'Partially True';
      else if (v.includes('not verifiable')) verdict = 'Unverifiable';
      else if (v.includes('true')) verdict = 'True';
      else if (v.includes('false')) verdict = 'False';

      let rawConf = parsed.confidence;
      if (typeof rawConf === 'string') rawConf = parseFloat(rawConf.replace('%', ''));
      const confidenceScore = isNaN(rawConf) ? 0 : rawConf / 100;

      const conflictingEvidence = verdict === 'Partially True';
      const conflictNote = conflictingEvidence ? parsed.reasoning : null;

      const citations = (parsed.evidence || []).map(e => ({
        title: e.title || 'Unknown Source',
        url: e.url || '',
        relevantSnippet: e.snippet || ''
      }));

      const result = {
        claimId,
        verdict,
        confidenceScore,
        reasoning: parsed.reasoning || 'No reasoning provided.',
        conflictingEvidence,
        conflictNote,
        temporallySensitive: false,
        citations
      };

      await sleep(1000);
      return result;
    }

    throw new Error('Invalid JSON output from model');
  } catch (err) {
    console.error(`Error verifying claim ${claim.id}:`, err.message);
    await sleep(1000);
    return {
      verdict: 'Unverifiable',
      confidenceScore: 0.0,
      reasoning: 'Error during verification process.',
      conflictingEvidence: false,
      conflictNote: null,
      temporallySensitive: false,
      citations: []
    };
  }
}

module.exports = { verifyClaim };
