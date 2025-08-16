import yts from 'yt-search';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid query parameter "q"' 
      });
    }
    
    console.log(`📝 [API] Received search request: "${q}"`);
    
    // Search videos with timeout
    const searchPromise = yts(q.trim());
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Search timeout after 15 seconds')), 15000);
    });
    
    const result = await Promise.race([searchPromise, timeoutPromise]);
    const videos = result.videos || [];
    
    // Limit and transform results
    const limitedVideos = videos.slice(0, parseInt(limit)).map(video => ({
      id: video.videoId,
      videoId: video.videoId,
      title: video.title,
      description: video.description || '',
      url: video.url,
      thumbnail: video.thumbnail || '',
      channelTitle: video.author?.name || '',
      publishedAt: video.ago || '',
      duration: video.duration?.timestamp || '',
      views: video.views || 0,
      timestamp: video.timestamp || ''
    }));
    
    console.log(`✅ [API] Found ${limitedVideos.length} videos for "${q}"`);
    
    res.json({
      success: true,
      videos: limitedVideos,
      count: limitedVideos.length,
      query: q.trim()
    });
    
  } catch (error) {
    console.error(`❌ [API] Error in search:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
