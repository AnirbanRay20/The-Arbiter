require('dotenv').config();
const Groq = require('groq-sdk');
const { VERIFICATION_SYSTEM_PROMPT } = require('../utils/prompts');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function verifyClaim(claim, sources) {
  sources = sources || [];

  const claimId    = claim.id    || 'C1';
  const claimText  = claim.claim || '';
  const isQuestion = claim.isQuestion || false;

  // Build evidence string
  const evidenceStr = sources.length > 0
    ? sources.map((s, i) =>
        `[${i + 1}] ${s.title || 'Unknown'} (${s.url || ''})\n${s.snippet || s.content || 'No content'}`
      ).join('\n\n')
    : 'No web evidence was retrieved for this claim.';

  const userPrompt = `CLAIM ID: ${claimId}
CLAIM: "${claimText}"
IS_QUESTION: ${isQuestion}

EVIDENCE:
${evidenceStr}

Reason step-by-step and evaluate the claim against this evidence only.
Before finalising, ask yourself: am I using internal knowledge? If yes, mark Unverifiable.
Output ONLY valid JSON — no markdown, no extra text.`;

  let retries = 0;
  while (retries < 3) {
    try {
      const response = await groq.chat.completions.create({
        model:       'llama-3.3-70b-versatile', // ← upgraded from 8b to 70b
        temperature: 0,
        max_tokens:  1000,
        messages: [
          { role: 'system', content: VERIFICATION_SYSTEM_PROMPT },
          { role: 'user',   content: userPrompt }
        ]
      });

      const content = response.choices[0]?.message?.content || '';
      console.log(`[VerificationEngine] ${claimId} FULL RESPONSE:`, content);

      // ── Parse JSON ── strip markdown fences first
      let parsed = null;

      // Strip ```json ... ``` or ``` ... ``` wrappers
      let cleaned = content.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      // Try direct parse first
      try { parsed = JSON.parse(cleaned); } catch {}

      // Extract JSON block if direct parse failed
      if (!parsed) {
        const start = cleaned.indexOf('{');
        const end   = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch {}
        }
      }

      // Last resort — try original content
      if (!parsed) {
        const start = content.indexOf('{');
        const end   = content.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          try { parsed = JSON.parse(content.slice(start, end + 1)); } catch {}
        }
      }

      if (parsed && parsed.verdict) {
        // Normalize verdict spelling variations
        const v = (parsed.verdict || '').toLowerCase().trim();
        let verdict = 'Unverifiable';
        if (v.includes('partially') || v.includes('partial')) verdict = 'Partially True';
        else if (v === 'true' || v.includes('confirmed')) verdict = 'True';
        else if (v === 'false' || v.includes('incorrect') || v.includes('contradicted')) verdict = 'False';
        else if (v.includes('unverif') || v.includes('insufficient') || v.includes('not verif')) verdict = 'Unverifiable';

        // Normalize confidence score — handle all formats
        let conf = parsed.confidenceScore ?? parsed.confidence ?? parsed.confidence_score ?? 0;
        if (typeof conf === 'string') conf = parseFloat(conf.replace('%', '').trim());
        if (isNaN(conf) || conf === null || conf === undefined) conf = 0;
        if (conf > 1) conf = conf / 100; // convert percentage (e.g. 85 → 0.85)
        // If verdict is True/False but confidence is 0, assign a reasonable default
        if (conf === 0 && (verdict === 'True' || verdict === 'False')) conf = 0.75;
        if (conf === 0 && verdict === 'Partially True') conf = 0.55;
        conf = Math.min(Math.max(conf, 0), 1); // clamp between 0 and 1

        // Extract direct answer for questions
        let directAnswer = parsed.directAnswer || null;
        if (!directAnswer && isQuestion && parsed.reasoning) {
          const firstSentence = parsed.reasoning.split('.')[0];
          if (firstSentence.length > 10 && firstSentence.length < 200) {
            directAnswer = firstSentence.trim() + '.';
          }
        }

        const result = {
          claimId,
          verdict,
          confidenceScore:     conf,
          reasoning:           parsed.reasoning || parsed.explanation || 'No reasoning provided.',
          conflictingEvidence: parsed.conflictingEvidence || false,
          conflictNote:        parsed.conflictNote || null,
          temporallySensitive: parsed.temporallySensitive || false,
          isQuestion,
          directAnswer,
          citations: Array.isArray(parsed.citations) && parsed.citations.length > 0
            ? parsed.citations
            : sources.slice(0, 3).map(s => ({
                url:             s.url   || '',
                title:           s.title || 'Unknown Source',
                relevantSnippet: s.snippet || ''
              })),
        };

        console.log(`[VerificationEngine] ${claimId} → ${verdict} (${Math.round(conf * 100)}%)`);
        await sleep(800);
        return result;
      }

      console.warn(`[VerificationEngine] ${claimId} — JSON parse failed, retrying (${retries + 1}/3)...`);
      retries++;
      await sleep(1200);

    } catch (err) {
      console.error(`[VerificationEngine] ${claimId} error:`, err.message);

      if (err.message?.includes('429') || err.message?.includes('rate_limit')) {
        console.log(`[VerificationEngine] Rate limited — waiting 4s...`);
        await sleep(4000);
        retries++;
        continue;
      }
      break;
    }
  }

  // Final fallback
  console.warn(`[VerificationEngine] ${claimId} — all retries failed, returning Unverifiable`);
  await sleep(500);
  return {
    claimId,
    verdict:             'Unverifiable',
    confidenceScore:     0.0,
    reasoning:           'Verification failed after multiple retries. The evidence was retrieved but could not be analyzed.',
    conflictingEvidence: false,
    conflictNote:        null,
    temporallySensitive: false,
    isQuestion,
    directAnswer:        null,
    citations:           sources.slice(0, 3).map(s => ({
      url: s.url || '', title: s.title || '', relevantSnippet: s.snippet || ''
    })),
  };
}

module.exports = { verifyClaim };