const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/chats.json');

// Ensure data directory exists
const dataDir = path.dirname(filePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadCache() {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveCache(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getCached(claim) {
  const cache = loadCache();
  // Try to find by claim text
  return cache[claim.toLowerCase().trim()] || null;
}

function getById(id) {
  const cache = loadCache();
  return cache[id] || null;
}

function setCache(claim, result, id = null) {
  const cache = loadCache();
  const entryId = id || Date.now().toString();
  
  const entry = {
    id: entryId,
    timestamp: new Date().toISOString(),
    q: claim,
    report: result
  };

  // Store by both claim (normalized) and ID
  cache[claim.toLowerCase().trim()] = entry;
  cache[entryId] = entry;
  
  saveCache(cache);
  return entryId;
}

module.exports = { getCached, getById, setCache };