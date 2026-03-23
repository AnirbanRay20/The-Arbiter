require('dotenv').config();
const Groq = require('groq-sdk');
const { EXTRACTOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────
// 🔍 Question-to-Proposition Converter
// Converts interrogative sentences to declarative form
// so the verifier can check them as factual claims.
// E.g. "Is the sky blue?" → "The sky is blue"
// ─────────────────────────────────────────────────────────────
function isQuestion(text = '') {
  const t = text.trim();
  // Check for trailing ? OR interrogative openers
  return (
    t.endsWith('?') ||
    /^(is|are|was|were|does|do|did|has|have|had|can|could|will|would|should|shall|may|might|who|what|when|where|why|how)\b/i.test(t)
  );
}

// ─────────────────────────────────────────────────────────────
// 🧹 Clean & Validate Extracted Claims
// ─────────────────────────────────────────────────────────────
function sanitizeClaims(raw) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map(c => (typeof c === 'string' ? c.trim() : String(c || '').trim()))
    .filter(c => {
      if (!c || c.length < 3) return false;           // allow short equations like "2+2=5"
      if (c.length > 500)      return false;           // runaway extraction
      // Reject pure opinions without factual content
      if (/^(i think|i believe|i feel|in my opinion|personally)/i.test(c)) return false;
      return true;
    })
    // Deduplicate
    .filter((c, i, arr) => arr.findIndex(x => x.toLowerCase() === c.toLowerCase()) === i);
}

// ─────────────────────────────────────────────────────────────
// 🔗 Pre-Process Symbolic Inputs
// ─────────────────────────────────────────────────────────────
function preprocess(input) {
  if (/[0-9+\-*/=]/.test(input) && input.length < 50) {
    return `The statement "${input}" is claimed to be true.`;
  }
  return input;
}

// ─────────────────────────────────────────────────────────────
// 📦 MAIN FUNCTION: Extract Claims from Text
// ─────────────────────────────────────────────────────────────
async function extractClaims(text) {
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    console.warn('[ClaimExtractor] Input too short or invalid');
    return [];
  }

  const processedText = preprocess(text.trim());

  try {
    const response = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      temperature: 0,       // deterministic extraction
      max_tokens:  2000,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            `Extract every individual atomic factual claim from this text.\n` +
            `CRITICAL: Preserve ALL numbers, dates, names, equations, and qualifiers EXACTLY as written.\n` +
            `ABSOLUTE RULE: Do NOT correct or rewrite false or mathematically incorrect statements. Extract them EXACTLY as they are. (e.g. "2+2=7" must be extracted as "2+2=7", NOT corrected).\n` +
            `Also treat mathematical expressions and symbolic statements as valid factual claims.\n` +
            `Each claim must be ONE sentence about ONE fact. Do NOT merge multiple facts.\n` +
            `Convert any questions into declarative factual statements without changing their core meaning.\n\n` +
            `Text:\n${processedText.slice(0, 4000)}`  // cap at 4000 chars to avoid token overflow
        }
      ],
      response_format: { type: 'json_object' }   // enforce structured output
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[ClaimExtractor] Raw response (preview):', content.slice(0, 300));

    // ── Parse JSON ────────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Fallback: manually extract the JSON object if model added preamble
      const start = content.indexOf('{');
      const end   = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        parsed = JSON.parse(content.slice(start, end + 1));
      } else {
        console.warn('[ClaimExtractor] No JSON found in response');
        return [];
      }
    }

    const rawClaims = parsed.claims || parsed.extracted_claims || parsed.results || [];
    let cleanClaims = sanitizeClaims(rawClaims);

    // ── Fallback Mechanism ────────────────────────────────────
    if (!cleanClaims.length && text.trim().length > 0) {
      console.warn('[ClaimExtractor] No claims extracted. Using fallback.');
      cleanClaims = [text.trim()];
    }

    console.log(`[ClaimExtractor] Extracted ${cleanClaims.length} clean claims from ${rawClaims.length} raw`);

    // ── Map to claim objects ──────────────────────────────────
    return cleanClaims.map((c, i) => ({
      id:         `C${i + 1}`,
      claim:      c,
      context:    c,
      isQuestion: isQuestion(c)   // improved detection vs. endsWith('?') only
    }));

  } catch (err) {
    console.error('[ClaimExtractor] Error:', err.message);
    return [];
  }
}

module.exports = { extractClaims };
