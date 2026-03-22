require('dotenv').config();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Try these models in order until one works
const VISION_MODELS = [
  'meta-llama/llama-4-scout-17b-16e-instruct',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'llama-3.2-90b-vision-preview',
  'llama-3.2-11b-vision-preview',
];

const IMAGE_ANALYSIS_PROMPT = `You are an expert forensic image analyst specializing in detecting AI-generated images, deepfakes, and synthetic media.

Analyze the provided image carefully and determine whether it is AI-generated/synthetic or a real authentic photograph.

Look for these AI generation signals:
- Unnatural skin texture, plastic-like appearance
- Inconsistent lighting or impossible shadows
- Blurry or morphed background details
- Extra/missing fingers, distorted hands
- Asymmetric facial features
- Text in image that is garbled or nonsensical
- Watermarks from AI tools (DALL-E, Midjourney, Stable Diffusion, etc.)
- Overly perfect symmetry or unnaturally smooth surfaces
- Background objects that blur into each other
- Eyes that appear glassy or unnatural

Look for these authentic image signals:
- Natural imperfections, grain, noise
- Consistent lighting matching environment
- Natural motion blur or depth of field
- Real-world context clues
- Natural skin pores, hair strands, fabric texture

IMPORTANT: If this is a logo, icon, screenshot, diagram, illustration, or graphic design — set verdict to "Not a Photograph" and aiProbability to 0.5 with low confidence.

Output ONLY valid JSON. No markdown. No extra text.

{
  "aiProbability": 0.0,
  "verdict": "AI Generated | Likely Authentic | Uncertain | Not a Photograph",
  "confidence": 0.0,
  "signals": ["signal1", "signal2"],
  "explanation": "2-3 sentence explanation of the determination.",
  "metadata": {
    "hasWatermark": false,
    "detectedTool": null,
    "imageType": "portrait | landscape | object | logo | screenshot | illustration | other"
  }
}`;

async function analyzeImage(imageBase64, mimeType = 'image/jpeg') {
  let lastError = null;

  for (const model of VISION_MODELS) {
    try {
      console.log(`[ImageAnalyzer] Trying model: ${model}`);

      const response = await groq.chat.completions.create({
        model,
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
              { type: 'text', text: IMAGE_ANALYSIS_PROMPT }
            ]
          }
        ]
      });

      const content = response.choices[0]?.message?.content || '';
      console.log(`[ImageAnalyzer] ${model} response:`, content.slice(0, 150));

      // Try direct parse first
      try {
        const direct = JSON.parse(content.trim());
        if (direct.aiProbability !== undefined) {
          console.log(`[ImageAnalyzer] Success with ${model}`);
          return direct;
        }
      } catch {}

      // Extract JSON object
      const start = content.indexOf('{');
      const end   = content.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        const parsed = JSON.parse(content.slice(start, end + 1));
        if (parsed.aiProbability !== undefined) {
          console.log(`[ImageAnalyzer] Success with ${model}`);
          return parsed;
        }
      }

    } catch (err) {
      lastError = err.message;
      console.warn(`[ImageAnalyzer] Model ${model} failed: ${err.message}`);

      // If rate limited, wait before trying next
      if (err.message?.includes('429')) {
        await new Promise(r => setTimeout(r, 2000));
      }
      continue; // Try next model
    }
  }

  // All vision models failed — use heuristic fallback based on image properties
  console.error('[ImageAnalyzer] All vision models failed, using heuristic fallback');
  return heuristicFallback(lastError);
}

// Heuristic fallback when no vision model available
function heuristicFallback(errorMsg) {
  return {
    aiProbability:   0.5,
    verdict:         'Uncertain',
    confidence:      0.2,
    signals:         [
      'Vision model unavailable',
      'Manual review recommended',
    ],
    explanation:     'AI vision analysis is currently unavailable on this API tier. The image could not be automatically analyzed. Please check the image manually or upgrade your Groq API plan for vision model access.',
    metadata: {
      hasWatermark: false,
      detectedTool: null,
      imageType:    'unknown',
    },
    modelError: errorMsg,
  };
}

async function analyzeImageFromUrl(imageUrl) {
  try {
    const fetch = (await import('node-fetch')).default;

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);

    const contentType = res.headers.get('content-type') || 'image/jpeg';

    // Skip non-image content types
    if (!contentType.startsWith('image/')) {
      return {
        aiProbability: 0.5, verdict: 'Not a Photograph', confidence: 0.1,
        signals: ['Non-image content type detected'],
        explanation: 'The URL did not return an image file.',
        metadata: { hasWatermark: false, detectedTool: null, imageType: 'other' },
      };
    }

    // Skip SVGs and GIFs (always vector/animation, not photographs)
    if (contentType.includes('svg') || contentType.includes('gif')) {
      return {
        aiProbability: 0.5, verdict: 'Not a Photograph', confidence: 0.9,
        signals: ['Vector graphic or animation — not a photograph'],
        explanation: 'This is a vector graphic (SVG) or animation (GIF), not a photograph. AI detection is not applicable.',
        metadata: { hasWatermark: false, detectedTool: null, imageType: 'illustration' },
      };
    }

    const buffer  = await res.buffer();

    // Skip very small images (likely icons/pixels)
    if (buffer.length < 5000) {
      return {
        aiProbability: 0.5, verdict: 'Not a Photograph', confidence: 0.9,
        signals: ['Image too small — likely an icon or tracking pixel'],
        explanation: 'The image is too small to be a meaningful photograph (under 5KB). Skipping AI analysis.',
        metadata: { hasWatermark: false, detectedTool: null, imageType: 'icon' },
      };
    }

    const base64  = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return analyzeImage(dataUrl, contentType);

  } catch (err) {
    console.error('[ImageAnalyzer] URL fetch error:', err.message);
    return {
      aiProbability: 0.5, verdict: 'Uncertain', confidence: 0.1,
      signals: ['Could not fetch image from URL'],
      explanation: `Failed to retrieve image: ${err.message}`,
      metadata: { hasWatermark: false, detectedTool: null, imageType: 'other' },
      error: err.message,
    };
  }
}

module.exports = { analyzeImage, analyzeImageFromUrl };
