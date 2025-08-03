const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// GET /api/search route
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Check if q parameter is provided
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or invalid query parameter "q".' });
    }

    res.json({
      message: 'Search endpoint ready',
      query: q.trim(),
      status: 'success'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 