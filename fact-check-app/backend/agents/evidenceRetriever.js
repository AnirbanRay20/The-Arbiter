require('dotenv').config();
const Groq = require('groq-sdk');
const { QUERY_FORMULATOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function retrieveEvidence(claimData) {
  const claimId = claimData.id;
  const claimText = claimData.claim;

  // 1. Formulate search query using Groq
  let searchQuery = claimText; // fallback
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: QUERY_FORMULATOR_SYSTEM_PROMPT },
        { role: 'user', content: `Claim: ${claimText}` }
      ]
    });
    searchQuery = response.choices[0]?.message?.content?.trim() || claimText;
  } catch (err) {
    console.error(`Error formulating query for ${claimId}:`, err.message);
  }

  // 2. Execute Tavily Search
  const sources = [];
  const tavilyKey = process.env.TAVILY_API_KEY;
  if (!tavilyKey) {
    return { claimId, searchQuery, sources: [], error: 'Tavily API Key missing' };
  }

  let retries = 0;
  while (retries < 2) {
    try {
      const fetch = (await import('node-fetch')).default;
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: searchQuery,
          search_depth: 'advanced',
          max_results: 5
        })
      });

      if (tavilyRes.status === 429) {
        await sleep(2000);
        retries++;
        continue;
      }

      const data = await tavilyRes.json();
      if (data.results) {
        for (const item of data.results) {
          const domain = item.url?.includes('//') ? item.url.split('/')[2] : '';
          sources.push({
            title: item.title,
            url: item.url,
            snippet: item.content,
            domain,
            credibilityScore: item.score
          });
        }
      }
      break;
    } catch (err) {
      console.error(`Search error for ${claimId}:`, err.message);
      break;
    }
  }

  // Groq rate limit guard
  await sleep(1000);

  return { claimId, searchQuery, sources };
}

module.exports = { retrieveEvidence };
