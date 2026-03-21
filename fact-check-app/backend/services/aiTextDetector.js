require('dotenv').config();
const Groq = require('groq-sdk');
const { AI_DETECTOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function detectAiText(text) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: AI_DETECTOR_SYSTEM_PROMPT },
        { role: 'user', content: `TEXT TO ANALYZE:\n${text}` }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error('Invalid JSON output');
  } catch (err) {
    console.error('Error in AI detection:', err.message);
    return {
      aiProbability: 0.0,
      humanProbability: 0.0,
      signals: [],
      summary: 'AI detection failed due to an error.',
      error: err.message
    };
  }
}

module.exports = { detectAiText };
