const functions = require('firebase-functions');

exports.filmot = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed. Use GET.' });
    return;
  }

  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(400).json({ error: 'Missing or invalid query parameter "q".' });
      return;
    }

    const encodedQuery = encodeURIComponent(q.trim());
    const filmotUrl = `https://filmot.com/api/v1/search?q=${encodedQuery}`;
    
    console.log(`[Firebase Function] Making request to Filmot API: ${filmotUrl}`);

    const response = await fetch(filmotUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'YouTube-Searcher/1.0'
      }
    });

    if (!response.ok) {
      console.error(`[Firebase Function] Filmot API error: ${response.status} ${response.statusText}`);
      res.status(response.status).json({ 
        error: `Filmot API error: ${response.status} ${response.statusText}` 
      });
      return;
    }

    const data = await response.json();
    
    res.status(200).json({ 
      success: true, 
      query: q.trim(), 
      data: data, 
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('[Firebase Function] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}); 