const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/chats.json');

// Ensure data directory exists
const dataDir = path.dirname(filePath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadStorage() {
  try {
    if (!fs.existsSync(filePath)) return {};
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function saveStorage(data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

/**
 * Get report by unique ID
 */
function getById(id) {
  const storage = loadStorage();
  return storage[id] || null;
}

/**
 * Save report to storage for sharing/history
 */
function saveReport(claim, result, id = null) {
  const storage = loadStorage();
  const entryId = id || Date.now().toString();
  
  const entry = {
    id: entryId,
    timestamp: new Date().toISOString(),
    q: claim,
    report: result
  };

  // We only store by ID to support sharing/link-retrieval.
  // We NO LONGER store by claim text to avoid "hallucinations" of old results.
  storage[entryId] = entry;
  
  saveStorage(storage);
  return entryId;
}

module.exports = { getById, saveReport };
