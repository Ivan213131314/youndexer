const yts = require('yt-search');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phrases, videosPerPhrase = 10 } = req.body;
    
    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid phrases array' 
      });
    }
    
    console.log(`🚀 [API] Batch search for ${phrases.length} phrases`);
    
    const allVideos = [];
    const seenVideoIds = new Set();
    
    // Search all phrases in parallel
    const searchPromises = phrases.map(async (phrase, index) => {
      console.log(`📝 [API] Searching phrase ${index + 1}/${phrases.length}: "${phrase}"`);
      
      try {
        const searchPromise = yts(phrase);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Search timeout after 15 seconds')), 15000);
        });
        
        const result = await Promise.race([searchPromise, timeoutPromise]);
        const videos = result.videos || [];
        
        // Transform videos
        const transformedVideos = videos.slice(0, videosPerPhrase).map(video => ({
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
        
        return { phrase, videos: transformedVideos, phraseIndex: index };
      } catch (error) {
        console.error(`❌ [API] Error searching phrase "${phrase}":`, error);
        return { phrase, videos: [], phraseIndex: index };
      }
    });
    
    const results = await Promise.all(searchPromises);
    
    // Process results and remove duplicates
    for (const { phrase, videos, phraseIndex } of results) {
      let newVideosCount = 0;
      
      for (const video of videos) {
        const videoId = video.id || video.videoId;
        
        if (!seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          allVideos.push({
            ...video,
            searchPhrase: phrase,
            phraseIndex: phraseIndex,
            duplicateCount: 1
          });
          newVideosCount++;
        } else {
          // Increment duplicate count
          const existingVideo = allVideos.find(v => (v.id || v.videoId) === videoId);
          if (existingVideo) {
            existingVideo.duplicateCount = (existingVideo.duplicateCount || 1) + 1;
          }
        }
      }
      
      console.log(`✅ [API] Added ${newVideosCount} new videos from "${phrase}"`);
    }
    
    // Count duplicates
    const duplicateStats = {};
    allVideos.forEach(video => {
      const count = video.duplicateCount || 1;
      duplicateStats[count] = (duplicateStats[count] || 0) + 1;
    });
    
    console.log(`🎉 [API] Batch search completed! Total unique videos: ${allVideos.length}`);
    
    res.json({
      success: true,
      videos: allVideos,
      totalVideos: allVideos.length,
      duplicateStats: duplicateStats,
      phrases: phrases
    });
    
  } catch (error) {
    console.error(`❌ [API] Error in batch search:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
