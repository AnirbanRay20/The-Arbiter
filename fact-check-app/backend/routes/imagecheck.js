const express  = require('express');
const router   = express.Router();
const multer   = require('multer');
const { analyzeImage, analyzeImageFromUrl } = require('../services/imageAnalyzer');

// Store image in memory (no disk write)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'), false);
  }
});

// POST /api/analyze-image  (file upload)
router.post('/analyze-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const base64   = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl  = `data:${mimeType};base64,${base64}`;

    console.log(`[ImageRoute] Analyzing uploaded image: ${req.file.originalname} (${req.file.size} bytes)`);
    const result = await analyzeImage(dataUrl, mimeType);
    res.json(result);

  } catch (err) {
    console.error('[ImageRoute] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/analyze-image-url  (URL)
router.post('/analyze-image-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'No URL provided' });

    console.log(`[ImageRoute] Analyzing image URL: ${url}`);
    const result = await analyzeImageFromUrl(url);
    res.json(result);

  } catch (err) {
    console.error('[ImageRoute] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
