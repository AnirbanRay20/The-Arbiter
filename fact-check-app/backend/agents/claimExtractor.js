require('dotenv').config();
const Groq = require('groq-sdk');
const { EXTRACTOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractClaims(text) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Extract every individual atomic factual claim from this text. Each claim must be ONE sentence about ONE fact. Do NOT merge multiple facts into a single claim.\n\nText:\n${text}`
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[ClaimExtractor] Raw response:', content.slice(0, 300));

    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(content.slice(start, end + 1));
      const extractedClaims = parsed.claims || [];
      console.log(`[ClaimExtractor] Extracted ${extractedClaims.length} claims`);
      return extractedClaims.map((c, i) => ({
        id: `C${i + 1}`,
        claim: c,
        context: c,
        isQuestion: c.endsWith('?')
      }));
    }
    console.warn('[ClaimExtractor] No JSON object found in response');
    return [];
  } catch (err) {
    console.error('Error extracting claims:', err.message);
    return [];
  }
}

module.exports = { extractClaims };
