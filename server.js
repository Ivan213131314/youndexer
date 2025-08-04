const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const { YouTubeTranscriptApi } = require('youtube-transcript-api');


const app = express();
const PORT = 3001;
const searchVideoCount = 6;  // кол-во видео возвращаемых сервером

// CORS middleware
app.use(cors());
app.use(express.json());

/**
 * Search videos using yt-search library with retry logic
 * @param {string} phrase - Search phrase
 * @param {number} limit - Maximum number of videos
 * @param {number} retries - Number of retry attempts (default: 2)
 * @returns {Promise<Array>} Array of video objects
 */
async function searchVideos(phrase, limit = searchVideoCount, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔍 [SERVER] Searching for: "${phrase}" (attempt ${attempt}/${retries})`);
      
      // Add timeout to prevent hanging - reduced to 15 seconds
      const searchPromise = yts(phrase);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Search timeout after 15 seconds')), 15000);
      });
      
      console.log(`⏱️ [SERVER] Starting yt-search with timeout...`);
      const result = await Promise.race([searchPromise, timeoutPromise]);
      
      console.log(`📦 [SERVER] Raw yt-search result:`, result);
      const videos = result.videos || [];
      
      console.log(`📊 [SERVER] Found ${videos.length} videos`);
      
      // Limit and transform results
      const limitedVideos = videos.slice(0, limit).map(video => ({
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
      
      console.log(`✅ [SERVER] Returning ${limitedVideos.length} videos`);
      return limitedVideos;
      
    } catch (error) {
      console.error(`❌ [SERVER] Error searching videos (attempt ${attempt}):`, error.message);
      
      if (attempt === retries) {
        console.error(`❌ [SERVER] All ${retries} attempts failed for phrase: "${phrase}"`);
        return [];
      }
      
      // Wait before retry
      const waitTime = attempt * 2000; // 2s, 4s
      console.log(`⏳ [SERVER] Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * Get transcript for a video using YouTube Transcript API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<string|null>} Transcript text or null if not available
 */
async function getVideoTranscript(videoId) {
  try {
    console.log(`📝 [SERVER] Getting transcript for video: ${videoId}`);
    
    const ytt_api = new YouTubeTranscriptApi();
    
    // Add timeout to prevent hanging
    const transcriptPromise = ytt_api.fetch(videoId, ['ru', 'en']);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Transcript timeout after 10 seconds')), 10000);
    });
    
    const transcript = await Promise.race([transcriptPromise, timeoutPromise]);
    
    // Combine all transcript snippets into one text
    const transcriptText = transcript.map(snippet => snippet.text).join(' ');
    
    console.log(`✅ [SERVER] Successfully got transcript for ${videoId} (${transcriptText.length} characters)`);
    return transcriptText;
    
  } catch (error) {
    console.log(`⚠️ [SERVER] No transcript available for video ${videoId}:`, error.message);
    return null;
  }
}


/**
 * Add transcripts to videos array
 * @param {Array} videos - Array of video objects
 * @returns {Promise<Array>} Videos with transcripts added
 */
async function addTranscriptsToVideos(videos) {
  console.log(`\n📝 [SERVER] Adding transcripts to ${videos.length} videos...`);
  
  // Create array of promises for all transcript requests
  const transcriptPromises = videos.map(async (video) => {
    const transcript = await getVideoTranscript(video.videoId);
    return {
      ...video,
      transcript: transcript
    };
  });
  
  // Wait for all transcript requests to complete in parallel
  console.log(`⚡ [SERVER] Fetching ${videos.length} transcripts in parallel...`);
  const videosWithTranscripts = await Promise.all(transcriptPromises);
  
  console.log(`✅ [SERVER] Added transcripts to ${videosWithTranscripts.length} videos`);
  return videosWithTranscripts;
}

// GET /api/search - search for videos
app.get('/api/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid query parameter "q"' 
      });
    }
    
    console.log(`📝 [SERVER] Received search request: "${q}"`);
    
    const videos = await searchVideos(q.trim(), parseInt(limit));
    
    res.json({
      success: true,
      videos: videos,
      count: videos.length,
      query: q.trim()
    });
    
  } catch (error) {
    console.error(`❌ [SERVER] Error in /api/search:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /api/batch-search - search multiple phrases
app.post('/api/batch-search', async (req, res) => {
  try {
    const { phrases, videosPerPhrase = 10 } = req.body;
    
    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid phrases array' 
      });
    }
    
    console.log(`🚀 [SERVER] Batch search for ${phrases.length} phrases`);
    
    const allVideos = [];
    const seenVideoIds = new Set();
    
    // Search all phrases in parallel
    const searchPromises = phrases.map(async (phrase, index) => {
      console.log(`📝 [SERVER] Searching phrase ${index + 1}/${phrases.length}: "${phrase}"`);
      const videos = await searchVideos(phrase, videosPerPhrase);
      return { phrase, videos, phraseIndex: index };
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
      
      console.log(`✅ [SERVER] Added ${newVideosCount} new videos from "${phrase}"`);
    }
    
    // Count duplicates
    const duplicateStats = {};
    allVideos.forEach(video => {
      const count = video.duplicateCount || 1;
      duplicateStats[count] = (duplicateStats[count] || 0) + 1;
    });
    
    console.log(`🎉 [SERVER] Batch search completed! Total unique videos: ${allVideos.length}`);
    
    res.json({
      success: true,
      videos: allVideos,
      totalVideos: allVideos.length,
      duplicateStats: duplicateStats,
      phrases: phrases
    });
    
  } catch (error) {
    console.error(`❌ [SERVER] Error in /api/batch-search:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// POST /api/transcripts - add transcripts to videos
app.post('/api/transcripts', async (req, res) => {
  try {
    const { videos } = req.body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid videos array' 
      });
    }
    
    console.log(`📝 [SERVER] Adding transcripts to ${videos.length} videos`);
    
    const videosWithTranscripts = await addTranscriptsToVideos(videos);
    
    res.json({
      success: true,
      videos: videosWithTranscripts,
      count: videosWithTranscripts.length
    });
    
  } catch (error) {
    console.error(`❌ [SERVER] Error in /api/transcripts:`, error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] YouTube search server running on http://localhost:${PORT}`);
  console.log(`📡 [SERVER] Available endpoints:`);
  console.log(`   GET  /api/search?q=<query>&limit=<number>`);
  console.log(`   POST /api/batch-search (with phrases array in body)`);
  console.log(`   POST /api/transcripts (with videos array in body)`);
}); 