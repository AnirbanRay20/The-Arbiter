require('dotenv').config();
const express = require('express');
const cors = require('cors');
const factcheckRouter  = require('./routes/factcheck');
const aidetectRouter   = require('./routes/aidetect');
//const chatsRouter      = require('./routes/chats');
const imageCheckRouter = require('./routes/imagecheck'); // ← NEW

const app  = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Routes
app.use('/api', factcheckRouter);
app.use('/api', aidetectRouter);
//app.use('/api', chatsRouter);
app.use('/api', imageCheckRouter); // ← NEW

app.listen(PORT, () => {
  console.log(`✅ The Arbiter backend running on http://localhost:${PORT}`);
});