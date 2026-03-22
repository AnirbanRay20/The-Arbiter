require('dotenv').config();
const Groq = require('groq-sdk');
const { AI_DETECTOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function detectAiText(text) {
  try {
    // Truncate very long texts to first 2000 chars for speed
    const truncated = text.length > 2000 ? text.slice(0, 2000) + '...' : text;

    const response = await groq.chat.completions.create({
      model:       'llama-3.3-70b-versatile',
      temperature: 0,
      max_tokens:  500,
      messages: [
        { role: 'system', content: AI_DETECTOR_SYSTEM_PROMPT },
        {
          role:    'user',
          content: `Analyze this text and return ONLY a JSON object with aiProbability, humanProbability, signals array, and summary.\n\nTEXT TO ANALYZE:\n${truncated}`
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[AIDetector] Raw response:', content.slice(0, 200));

    // Try direct JSON parse first
    try {
      const direct = JSON.parse(content.trim());
      if (direct.aiProbability !== undefined) return direct;
    } catch {}

    // Fallback: extract JSON object from response
    const start = content.indexOf('{');
    const end   = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      const parsed = JSON.parse(content.slice(start, end + 1));
      console.log('[AIDetector] Parsed result:', parsed.aiProbability, parsed.humanProbability);
      return parsed;
    }

    throw new Error('No valid JSON found in AI detector response');

  } catch (err) {
    console.error('[AIDetector] Error:', err.message);
    // Return a neutral fallback instead of 0/0
    return {
      aiProbability:   0.5,
      humanProbability: 0.5,
      signals:         ['Detection inconclusive'],
      summary:         'AI detection could not be completed. The text was too ambiguous or an error occurred during analysis.',
      error:           err.message
    };
  }
}

module.exports = { detectAiText };
