require('dotenv').config();
const Groq = require('groq-sdk');
const { QUERY_FORMULATOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq  = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// 🏛️ Domain Credibility Scoring
// ─────────────────────────────────────────────────────────────
function getCredibilityScore(url = '') {
  if (!url) return 0.3;
  const u = url.toLowerCase();

  if (u.includes('.gov'))                                        return 0.95;
  if (u.includes('.edu'))                                        return 0.90;
  if (u.includes('reuters.com') || u.includes('apnews.com'))    return 0.88;
  if (u.includes('bbc.com') || u.includes('bbc.co.uk'))         return 0.85;
  if (u.includes('nytimes.com') || u.includes('theguardian.com')) return 0.82;
  if (u.includes('wikipedia.org'))                               return 0.78;
  if (u.includes('nature.com') || u.includes('science.org'))    return 0.90;
  if (u.includes('who.int') || u.includes('cdc.gov'))           return 0.95;
  if (u.includes('medium.com') || u.includes('substack.com'))   return 0.45;
  if (u.includes('reddit.com'))                                  return 0.25;
  if (u.includes('twitter.com') || u.includes('x.com'))         return 0.20;
  if (u.includes('facebook.com') || u.includes('instagram.com')) return 0.15;
  if (u.includes('blog.'))                                       return 0.40;

  return 0.55;
}

// ─────────────────────────────────────────────────────────────
// 🔍 Search Query Generator
// Uses Groq (fast 8B model) to formulate a precision query.
// Falls back to a simple template if the LLM call fails.
// ─────────────────────────────────────────────────────────────
async function generateSearchQuery(claimText) {
  try {
    const response = await groq.chat.completions.create({
      model:       'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens:  80,
      messages: [
        { role: 'system', content: QUERY_FORMULATOR_SYSTEM_PROMPT },
        { role: 'user',   content: `Claim: "${claimText}"` }
      ]
    });

    const query = response.choices[0]?.message?.content?.trim();
    if (query && query.length > 5) {
      // Strip any surrounding quotes the model might add
      return query.replace(/^["']|["']$/g, '').trim();
    }
  } catch (err) {
    console.error('[EvidenceRetriever] Query generation failed:', err.message);
  }

  // Fallback: simple but functional template
  return `${claimText} fact check evidence 2026`;
}

// ─────────────────────────────────────────────────────────────
// 📡 Single Tavily Search Pass
// ─────────────────────────────────────────────────────────────
async function tavilySearch(query, depth = 'advanced', maxResults = 7) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) throw new Error('Missing TAVILY_API_KEY');

  const fetch = (await import('node-fetch')).default;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000); // 18s timeout

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
      body: JSON.stringify({
        api_key:             tavilyKey,
        query,
        search_depth:        depth,          // 'advanced' = deep crawl
        max_results:         maxResults,
        include_answer:      true,           // Tavily's own synthesized answer
        include_raw_content: true,           // full page text (up to ~4000 chars)
        include_images:      false
      })
    });

    clearTimeout(timeout);

    if (res.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (!res.ok) {
      throw new Error(`Tavily API error: ${res.status}`);
    }

    return await res.json();

  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// 📊 Build & Rank Source Objects
// ─────────────────────────────────────────────────────────────
function buildSources(results) {
  const sources = results.map(item => {
    // Prefer raw_content (deep fetch) > content (snippet) > title
    const richContent = item.raw_content || item.content || item.snippet || '';

    return {
      title:           item.title   || 'Unknown',
      url:             item.url     || '',
      // Keep up to 2000 chars of raw content to give verifier maximum context
      content:         richContent.slice(0, 2000),
      // Keep snippet separately for UI display (shorter)
      snippet:         item.content?.slice(0, 400) || richContent.slice(0, 400),
      raw_content:     item.raw_content?.slice(0, 2000) || null,
      domain:          item.url?.split('/')[2] || '',
      score:           item.score || 0,           // Tavily relevance score
      credibilityScore: getCredibilityScore(item.url)
    };
  });

  // Rank: blend Tavily relevance score + our domain credibility
  sources.sort((a, b) => {
    const scoreA = (a.score * 0.5) + (a.credibilityScore * 0.5);
    const scoreB = (b.score * 0.5) + (b.credibilityScore * 0.5);
    return scoreB - scoreA;
  });

  return sources;
}

// ─────────────────────────────────────────────────────────────
// 🔥 MAIN FUNCTION: Retrieve Evidence for a Claim
// ─────────────────────────────────────────────────────────────
async function retrieveEvidence(claimData) {
  const claimId   = claimData.id    || 'C?';
  const claimText = claimData.claim || '';

  // 1. Generate precision search query
  const searchQuery = await generateSearchQuery(claimText);
  console.log(`[EvidenceRetriever] ${claimId} → query: "${searchQuery}"`);

  if (!process.env.TAVILY_API_KEY) {
    console.warn('[EvidenceRetriever] TAVILY_API_KEY not set — skipping search');
    return { claimId, searchQuery, sources: [], tavilyAnswer: null };
  }

  let retries = 0;
  while (retries < 2) {
    try {
      const data = await tavilySearch(searchQuery, 'advanced', 7);

      if (!data.results || data.results.length === 0) {
        console.warn(`[EvidenceRetriever] ${claimId} → no results returned`);
        return { claimId, searchQuery, sources: [], tavilyAnswer: data.answer || null };
      }

      const sources = buildSources(data.results);

      console.log(
        `[EvidenceRetriever] ${claimId} → ${sources.length} sources ` +
        `(top credibility: ${sources[0]?.credibilityScore?.toFixed(2)}, ` +
        `avg content: ${Math.round(sources.reduce((a, s) => a + (s.content?.length || 0), 0) / sources.length)} chars)`
      );

      // Small politeness delay to avoid hammering Tavily
      await sleep(300);

      return {
        claimId,
        searchQuery,
        sources,
        // Pass Tavily's own answer as an extra signal (not used as ground truth)
        tavilyAnswer: data.answer || null
      };

    } catch (err) {
      if (err.message === 'RATE_LIMITED') {
        console.warn(`[EvidenceRetriever] Rate limited on attempt ${retries + 1}, waiting 4s…`);
        await sleep(4000);
        retries++;
        continue;
      }

      if (err.name === 'AbortError') {
        console.error(`[EvidenceRetriever] ${claimId} → request timed out`);
      } else {
        console.error(`[EvidenceRetriever] ${claimId} → error:`, err.message);
      }
      break;
    }
  }

  // Fallback: return empty sources (verifier will mark Unverifiable)
  return { claimId, searchQuery, sources: [], tavilyAnswer: null };
}

module.exports = { retrieveEvidence };
