const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');

// Ensure data directory and file exist
async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(CHATS_FILE);
    } catch {
      await fs.writeFile(CHATS_FILE, JSON.stringify({}));
    }
  } catch (error) {
    console.error('Error initializing chats data file:', error);
  }
}

// Initialize on load
ensureDataFile();

// POST /api/chats - Save a chat session
router.post('/chats', async (req, res) => {
  try {
    const chatData = req.body;
    
    if (!chatData || !chatData.id) {
      return res.status(400).json({ error: 'Chat data and ID are required' });
    }

    const { id } = chatData;
    
    // Read existing file
    const data = await fs.readFile(CHATS_FILE, 'utf-8');
    const chats = JSON.parse(data || '{}');
    
    // Add or update chat
    chats[id] = chatData;
    
    // Write back
    await fs.writeFile(CHATS_FILE, JSON.stringify(chats, null, 2));
    
    res.status(201).json({ success: true, message: 'Chat saved successfully', id });
  } catch (error) {
    console.error('Error saving chat:', error);
    res.status(500).json({ error: 'Failed to save chat directory' });
  }
});

// GET /api/chats/:id - Retrieve a chat session
router.get('/chats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Read file
    const data = await fs.readFile(CHATS_FILE, 'utf-8');
    const chats = JSON.parse(data || '{}');
    
    const chatData = chats[id];
    
    if (!chatData) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    res.json(chatData);
  } catch (error) {
    console.error('Error retrieving chat:', error);
    res.status(500).json({ error: 'Failed to retrieve chat' });
  }
});

module.exports = router;
