require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const IMAGE_ANALYSIS_PROMPT = `You are an expert forensic image analyst specializing in detecting AI-generated images, deepfakes, and synthetic media.

Analyze the provided image and determine whether it is AI-generated/synthetic or a real authentic photograph.

Look for these AI generation signals:
- Unnatural skin texture, plastic-like appearance
- Inconsistent lighting or impossible shadows
- Blurry or morphed background details
- Extra/missing fingers, distorted hands
- Asymmetric facial features that look "off"
- Text in image that is garbled or nonsensical
- Repeating patterns that look algorithmically generated
- Watermarks from known AI tools (DALL-E, Midjourney, Stable Diffusion, etc.)
- Overly perfect symmetry or unnaturally smooth surfaces
- Background objects that blur into each other strangely
- Eyes that appear glassy or have unnatural catchlights

Look for these authentic image signals:
- Natural imperfections and grain/noise
- Consistent lighting matching environment
- Natural motion blur or depth of field
- Real-world context clues (identifiable locations, events)
- Natural skin pores, hair strands, fabric texture
- Consistent shadows matching light source

Output ONLY valid JSON. No markdown. No extra text.

{
  "aiProbability": 0.0,
  "verdict": "AI Generated | Likely Authentic | Uncertain",
  "confidence": 0.0,
  "signals": ["signal1", "signal2"],
  "explanation": "2-3 sentence explanation of the determination.",
  "metadata": {
    "hasWatermark": false,
    "detectedTool": null,
    "imageType": "portrait | landscape | object | text | other"
  }
}`;

async function analyzeImage(imageBase64, mimeType = 'image/jpeg') {
  try {
    // Groq supports vision with llama-3.2-90b-vision-preview
    const response = await groq.chat.completions.create({
      model: 'llama-3.2-90b-vision-preview',
      temperature: 0,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:${mimeType};base64,${imageBase64}`
              }
            },
            {
              type: 'text',
              text: IMAGE_ANALYSIS_PROMPT
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[ImageAnalyzer] Raw response:', content.slice(0, 200));

    // Parse JSON
    try {
      const direct = JSON.parse(content.trim());
      if (direct.aiProbability !== undefined) return direct;
    } catch {}

    const start = content.indexOf('{');
    const end   = content.lastIndexOf('}');
    if (start !== -1 && end !== -1) {
      return JSON.parse(content.slice(start, end + 1));
    }

    throw new Error('No valid JSON in response');

  } catch (err) {
    console.error('[ImageAnalyzer] Error:', err.message);

    // If vision model not available, fallback to text analysis
    if (err.message.includes('model') || err.message.includes('vision')) {
      return {
        aiProbability: 0.5,
        verdict: 'Uncertain',
        confidence: 0.3,
        signals: ['Vision model unavailable — analysis inconclusive'],
        explanation: 'The image analysis model is currently unavailable. Please try again or use a different image format.',
        metadata: { hasWatermark: false, detectedTool: null, imageType: 'other' },
        error: err.message
      };
    }

    return {
      aiProbability: 0.5,
      verdict: 'Uncertain',
      confidence: 0.3,
      signals: ['Analysis failed'],
      explanation: 'Image analysis could not be completed due to an error.',
      metadata: { hasWatermark: false, detectedTool: null, imageType: 'other' },
      error: err.message
    };
  }
}

async function analyzeImageFromUrl(imageUrl) {
  try {
    const fetch = (await import('node-fetch')).default;

    // Fetch image and convert to base64
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);
    const res        = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer      = await res.buffer();
    const base64      = buffer.toString('base64');

    return analyzeImage(`data:${contentType};base64,${base64}`, contentType);

  } catch (err) {
    console.error('[ImageAnalyzer] URL fetch error:', err.message);
    return {
      aiProbability: 0.5,
      verdict: 'Uncertain',
      confidence: 0.3,
      signals: ['Could not fetch image from URL'],
      explanation: `Failed to retrieve image: ${err.message}`,
      metadata: { hasWatermark: false, detectedTool: null, imageType: 'other' },
      error: err.message
    };
  }
}

module.exports = { analyzeImage, analyzeImageFromUrl };
