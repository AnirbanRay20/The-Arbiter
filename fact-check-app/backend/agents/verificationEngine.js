require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// 📏 Evidence Quality Scorer
// Rates the retrieved sources — used to modulate confidence,
// NOT to override verdicts.
// ─────────────────────────────────────────────────────────────
function getEvidenceQualityScore(sources) {
  if (!sources || sources.length === 0) return 0;

  let score = 0;
  for (const s of sources) {
    const text = (s.snippet || s.content || s.title || '').toLowerCase();
    const url  = (s.url || '').toLowerCase();

    // Content depth check
    if (text.length > 200) score += 0.4;
    else if (text.length > 80) score += 0.2;

    // Domain credibility bonus
    if (url.includes('.gov') || url.includes('.edu')) score += 0.3;
    else if (url.includes('reuters') || url.includes('bbc') || url.includes('apnews')) score += 0.25;
    else if (url.includes('wikipedia')) score += 0.15;

    // Noise penalty
    if (
      text.includes('subscribe to') ||
      text.includes('click here') ||
      text.includes('advertisement') ||
      text.includes('cookie policy')
    ) score -= 0.3;
  }

  // Normalize to 0–1 range
  return Math.max(0, Math.min(1, score / Math.min(sources.length, 5)));
}

// ─────────────────────────────────────────────────────────────
// 🎯 Verdict Normalizer
// Maps raw LLM string to canonical label.
// ─────────────────────────────────────────────────────────────
function normalizeVerdict(raw) {
  if (!raw) return 'Unverifiable';

  const v = String(raw).trim().toLowerCase();

  if (v.includes('partially true') || v.includes('partial')) return 'Partially True';
  if (v.includes('true'))           return 'True';
  if (v.includes('false'))          return 'False';
  if (
    v.includes('unverifiable') ||
    v.includes('insufficient') ||
    v.includes('not verifiable') ||
    v.includes('cannot verify')
  )                                 return 'Unverifiable';

  return 'Unverifiable';
}

// ─────────────────────────────────────────────────────────────
// 🔒 Evidence Grounding Guard
// If the LLM signals it didn't use the evidence, force Unverifiable.
// This is the core anti-hallucination safeguard.
// ─────────────────────────────────────────────────────────────
function enforceGrounding(parsed, sources) {
  // If LLM explicitly flagged it wasn't grounded in evidence → override
  if (parsed.grounded_in_evidence === false) {
    return {
      verdict: 'Unverifiable',
      forcedReason: 'LLM indicated verdict was not grounded in retrieved evidence. Marked Unverifiable to prevent hallucination.'
    };
  }

  // If verdict is True/False but zero citations were provided → suspicious
  const citationCount = (parsed.citations || []).length;
  if (
    (parsed.verdict === 'True' || parsed.verdict === 'False') &&
    citationCount === 0 &&
    sources.length > 0
  ) {
    return {
      verdict: 'Unverifiable',
      forcedReason: 'Verdict was True/False but no evidence citations were provided. Marked Unverifiable to prevent parametric recall.'
    };
  }

  return null; // No override needed
}

// ─────────────────────────────────────────────────────────────
// 🔢 Confidence Calibration
// Calibrates final confidence based on verdict + evidence quality.
// ─────────────────────────────────────────────────────────────
function calibrateConfidence(verdict, rawConfidence, qualityScore, wasForced) {
  if (wasForced)                   return 0.2;  // Low confidence when we had to override
  if (verdict === 'Unverifiable')  return Math.max(0.15, Math.min(0.35, rawConfidence));
  if (verdict === 'Partially True') return Math.max(0.45, Math.min(0.70, 0.45 + qualityScore * 0.25));

  // True / False — scale with evidence quality
  const base = 0.65;
  const ceiling = 0.95;
  return parseFloat(Math.max(base, Math.min(ceiling, base + qualityScore * 0.30)).toFixed(2));
}

// ─────────────────────────────────────────────────────────────
// 🧠 MAIN FUNCTION: Evidence-Grounded Fact-Checking Engine
// ─────────────────────────────────────────────────────────────
async function verifyClaim(claim, sources = []) {
  const claimId   = claim.id   || 'C1';
  const claimText = claim.claim || '';
  const isQuestion = claim.isQuestion || false;

  // ── Guard: No sources at all → immediate Unverifiable ────────
  if (!sources || sources.length === 0) {
    return {
      claimId,
      verdict: 'Unverifiable',
      confidenceScore: 0.15,
      reasoning: 'No evidence was retrieved for this claim. Cannot verify without sources.',
      citations: [],
      isQuestion,
      groundingEnforced: false
    };
  }

  // ── Format evidence block (top 5, prefer richer content) ─────
  const topSources = sources
    .slice(0, 5);

  const evidenceBlock = topSources.map((s, i) => {
    // Use raw_content if available (deeper Tavily fetch), fall back to snippet
    const body = s.raw_content?.slice(0, 1500) || s.content || s.snippet || 'No content available.';
    return `[Source ${i + 1}]
Title   : ${s.title || 'Unknown'}
URL     : ${s.url   || 'N/A'}
Content : ${body}`;
  }).join('\n\n---\n\n');

  // ── Prompts ───────────────────────────────────────────────────
  const systemPrompt = `You are a forensic fact-checking AI. Your ONLY source of truth is the EVIDENCE block below.

ABSOLUTE RULE: Do NOT use your training knowledge or internal memory.
If the evidence does not support a verdict → return "Unverifiable".
Every True/False verdict MUST cite at least one source by its [Source N] index.
Set "grounded_in_evidence": false if you could not find relevant info in the evidence.`;

  const userPrompt = `
CLAIM: "${claimText}"

EVIDENCE:
${evidenceBlock}

INSTRUCTIONS:
- Evaluate the claim using ONLY the evidence above.
- "True"           → evidence clearly and explicitly supports it
- "False"          → evidence clearly and explicitly contradicts it
- "Partially True" → evidence partially supports it or is mixed
- "Unverifiable"   → evidence is absent, irrelevant, vague, or contradictory

Provide citations as 1-based source indices (e.g., [1, 3]).
Set "grounded_in_evidence": true if you used at least one source above.
Set "grounded_in_evidence": false if you had to rely on general knowledge.

OUTPUT (strict JSON only):
{
  "verdict": "True | False | Partially True | Unverifiable",
  "confidence": <number 0.0–1.0>,
  "grounded_in_evidence": <true | false>,
  "time_sensitive": <true | false>,
  "checked_at": "March 2026",
  "reasoning": "<explanation with specific source references>",
  "citations": [<1-based source indices>]
}`;

  // ── LLM Call with retry ───────────────────────────────────────
  let retries = 0;
  while (retries < 3) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,          // near-deterministic for fact tasks
        max_tokens: 1024,
        top_p: 0.9,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt   }
        ],
        response_format: { type: 'json_object' }  // enforce structured output
      });

      const raw = completion.choices[0]?.message?.content || '';
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('No valid JSON in LLM response');
        }
      }

      // ── Normalize verdict ───────────────────────────────────
      parsed.verdict = normalizeVerdict(parsed.verdict);

      // ── Grounding enforcement (anti-hallucination guard) ────
      const override = enforceGrounding(parsed, topSources);
      const wasForced = !!override;
      if (wasForced) {
        parsed.verdict  = override.verdict;
        parsed.reasoning = override.forcedReason;
        parsed.citations = [];
      }

      // ── Confidence calibration ──────────────────────────────
      const qualityScore    = getEvidenceQualityScore(topSources);
      const rawConfidence   = parseFloat(parsed.confidence) || 0.5;
      const finalConfidence = calibrateConfidence(parsed.verdict, rawConfidence, qualityScore, wasForced);

      // ── Build citation objects ──────────────────────────────
      const citationObjects = (parsed.citations || [])
        .map(index => {
          const s = topSources[index - 1];
          if (!s) return null;
          return {
            url:             s.url   || '',
            title:           s.title || 'Source',
            relevantSnippet: s.raw_content?.slice(0, 300) || s.content || s.snippet || ''
          };
        })
        .filter(Boolean);

      const result = {
        claimId,
        verdict:          parsed.verdict,
        confidenceScore:  finalConfidence,
        reasoning:        parsed.reasoning || 'Verified against retrieved evidence.',
        citations:        citationObjects,
        isQuestion,
        timeSensitive:    !!parsed.time_sensitive,
        checkedAt:        parsed.checked_at || 'March 2026',
        groundingEnforced: wasForced        // flag for UI transparency
      };

      console.log(
        `[VerificationEngine] "${claimId}" → ${result.verdict} ` +
        `(${Math.round(finalConfidence * 100)}%) ` +
        `[grounding_forced=${wasForced}]`
      );

      return result;

    } catch (err) {
      console.error(`[VerificationEngine] Attempt ${retries + 1} failed:`, err.message);
      retries++;
      if (retries < 3) await sleep(1000 * retries);
    }
  }

  // ── Hard fallback after 3 failed retries ──────────────────────
  return {
    claimId,
    verdict: 'Unverifiable',
    confidenceScore: 0.1,
    reasoning: 'Verification engine encountered a persistent error. Please retry.',
    citations: [],
    isQuestion,
    groundingEnforced: false
  };
}

module.exports = { verifyClaim };
