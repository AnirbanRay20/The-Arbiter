require('dotenv').config();
const Groq = require('groq-sdk');
const { EXTRACTOR_SYSTEM_PROMPT } = require('../utils/prompts');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractClaims(text) {
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      messages: [
        { role: 'system', content: EXTRACTOR_SYSTEM_PROMPT },
        { role: 'user', content: `User Input:\n${text}` }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      return JSON.parse(content.slice(start, end + 1));
    }
    return [];
  } catch (err) {
    console.error('Error extracting claims:', err.message);
    return [];
  }
}

module.exports = { extractClaims };
