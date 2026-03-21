require('dotenv').config();
const Groq = require('groq-sdk');
const { VERIFICATION_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function verifyClaim(claimText, evidenceData) {
  const claimId = evidenceData.claimId;
  const sources = evidenceData.sources || [];

  if (!sources.length) {
    return {
      claimId,
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

  const userPrompt = `CLAIM: ${claimText}\n\nEVIDENCE:\n${evidenceStr}\nNow reason step-by-step and evaluate the claim against this evidence only.\nBefore finalising, ask yourself: am I using internal knowledge? If yes, mark Unverifiable.`;

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
      const result = JSON.parse(content.slice(start, end + 1));
      await sleep(1000);
      return result;
    }
    throw new Error('Invalid JSON output from model');
  } catch (err) {
    console.error(`Error verifying claim ${claimId}:`, err.message);
    await sleep(1000);
    return {
      claimId,
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
