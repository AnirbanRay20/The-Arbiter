const express = require('express');
const router = express.Router();
const { detectAiText } = require('../services/aiTextDetector');

router.post('/detect-ai', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  try {
    const result = await detectAiText(text);
    res.json({ data: result }); // Added {data: x} to match frontend expectation
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
