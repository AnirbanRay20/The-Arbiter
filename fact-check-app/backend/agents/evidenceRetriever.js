require('dotenv').config();
const Groq = require('groq-sdk');
const { QUERY_FORMULATOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retrieveEvidence(claimData) {
  const claimId   = claimData.id;
  const claimText = claimData.claim;

  // 1. Formulate search query using Groq
  let searchQuery = claimText; // fallback
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 50,
      messages: [
        { role: 'system', content: QUERY_FORMULATOR_SYSTEM_PROMPT },
        { role: 'user', content: `Claim: ${claimText}` }
      ]
    });
    searchQuery = response.choices[0]?.message?.content?.trim() || claimText;
    // Strip any quotes the model may have added
    searchQuery = searchQuery.replace(/^["']|["']$/g, '').trim();
    console.log(`[EvidenceRetriever] ${claimId} → query: "${searchQuery}"`);
  } catch (err) {
    console.error(`Error formulating query for ${claimId}:`, err.message);
  }

  // 2. Execute Tavily Search with timeout
  const sources   = [];
  const tavilyKey = process.env.TAVILY_API_KEY;

  if (!tavilyKey) {
    console.warn('[EvidenceRetriever] TAVILY_API_KEY missing');
    return { claimId, searchQuery, sources: [], error: 'Tavily API Key missing' };
  }

  let retries = 0;
  while (retries < 2) {
    try {
      const fetch = (await import('node-fetch')).default;

      // 15 second timeout per search
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 15000);

      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        signal:  controller.signal,
        body: JSON.stringify({
          api_key:      tavilyKey,
          query:        searchQuery,
          search_depth: 'basic',   // 'basic' is faster than 'advanced'
          max_results:  5
        })
      });

      clearTimeout(timeout);

      if (tavilyRes.status === 429) {
        console.warn(`[EvidenceRetriever] Rate limited, waiting 3s...`);
        await sleep(3000);
        retries++;
        continue;
      }

      if (!tavilyRes.ok) {
        console.error(`[EvidenceRetriever] Tavily error ${tavilyRes.status}`);
        break;
      }

      const data = await tavilyRes.json();
      if (data.results) {
        for (const item of data.results) {
          const domain = item.url?.includes('//') ? item.url.split('/')[2] : '';
          sources.push({
            title:            item.title,
            url:              item.url,
            snippet:          item.content,
            domain,
            credibilityScore: item.score
          });
        }
        console.log(`[EvidenceRetriever] ${claimId} → ${sources.length} sources found`);
      }
      break;

    } catch (err) {
      if (err.name === 'AbortError') {
        console.error(`[EvidenceRetriever] Search timed out for ${claimId}`);
      } else {
        console.error(`[EvidenceRetriever] Search error for ${claimId}:`, err.message);
      }
      break;
    }
  }

  // Rate limit guard between claims
  await sleep(800);

  return { claimId, searchQuery, sources };
}

module.exports = { retrieveEvidence };
