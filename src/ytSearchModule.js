/**
 * YouTube search module - client side
 * Communicates with server that uses yt-search library
 */

const SERVER_URL = 'http://localhost:3001';
const TRANSCRIPT_SERVER_URL = 'http://localhost:3001';
const searchVideoCount = 6;
/**
 * Fetch videos from YouTube via server API
 * @param {string} phrase - Search phrase to look for
 * @param {number} limit - Maximum number of videos to return (default: 10)
 * @returns {Promise<Array>} Array of video objects
 */
export const fetchVideosByPhrase = async (phrase, limit = searchVideoCount) => {
  console.log(`\n🔍 [YT-SEARCH] Starting search for phrase: "${phrase}"`);
  
  try {
    // Validate input
    if (!phrase || typeof phrase !== 'string') {
      console.error('❌ [YT-SEARCH] Invalid phrase provided:', phrase);
      return [];
    }

    const trimmedPhrase = phrase.trim();
    if (trimmedPhrase.length === 0) {
      console.error('❌ [YT-SEARCH] Empty phrase provided');
      return [];
    }

    console.log(`📝 [YT-SEARCH] Searching for: "${trimmedPhrase}"`);
    console.log(`🎯 [YT-SEARCH] Limit: ${limit} videos`);

         // Make the API request to server
     const startTime = Date.now();
     
     console.log(`🌐 [YT-SEARCH] Making request to: ${SERVER_URL}/api/search?q=${encodeURIComponent(trimmedPhrase)}&limit=${limit}`);
     
     const response = await fetch(`${SERVER_URL}/api/search?q=${encodeURIComponent(trimmedPhrase)}&limit=${limit}`, {
       method: 'GET',
       headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json'
       }
     });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ [YT-SEARCH] Request completed in ${responseTime}ms`);
    console.log(`📊 [YT-SEARCH] Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`❌ [YT-SEARCH] HTTP error! Status: ${response.status} ${response.statusText}`);
      return [];
    }

    const result = await response.json();
    console.log(`📦 [YT-SEARCH] Server response:`, result);

    const videos = result.videos || [];
    console.log(`🎬 [YT-SEARCH] Found ${videos.length} videos`);

    // Log video details
    videos.forEach((video, index) => {
      console.log(`🎥 [YT-SEARCH] Video ${index + 1}: "${video.title}" (ID: ${video.videoId})`);
    });

    console.log(`✅ [YT-SEARCH] Successfully fetched videos for "${trimmedPhrase}"`);
    return videos;

  } catch (error) {
    console.error(`❌ [YT-SEARCH] Error fetching videos for phrase "${phrase}":`, error);
    console.error(`🔍 [YT-SEARCH] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
};

/**
 * Search for videos using multiple phrases and remove duplicates
 * @param {Array<string>} phrases - Array of search phrases
 * @param {number} videosPerPhrase - Number of videos to fetch per phrase (default: 10)
 * @returns {Promise<Array>} Array of unique video objects
 */
export const searchVideosWithPhrases = async (phrases, videosPerPhrase = 10) => {
  console.log(`\n🚀 [YT-SEARCH] Starting batch search with ${phrases.length} phrases`);
  
  try {
    // Create array of promises for all phrases
    const searchPromises = phrases.map(async (phrase, index) => {
      console.log(`📝 [YT-SEARCH] Starting search for phrase ${index + 1}/${phrases.length}: "${phrase}"`);
      const videos = await fetchVideosByPhrase(phrase, videosPerPhrase);
      return { phrase, videos, phraseIndex: index };
    });
    
    // Wait for all searches to complete
    console.log(`⚡ [YT-SEARCH] Executing ${phrases.length} searches in parallel...`);
    const results = await Promise.all(searchPromises);
    
    // Process all results and remove duplicates
    const allVideos = [];
    const seenVideoIds = new Set();
    
    for (const { phrase, videos, phraseIndex } of results) {
      console.log(`\n📝 [YT-SEARCH] Processing results for phrase: "${phrase}"`);
      
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
          // Video already exists, increment duplicate count
          const existingVideo = allVideos.find(v => (v.id || v.videoId) === videoId);
          if (existingVideo) {
            existingVideo.duplicateCount = (existingVideo.duplicateCount || 1) + 1;
          }
          console.log(`🔄 [YT-SEARCH] Duplicate video found: "${video.title}" (ID: ${videoId}) - now appears ${existingVideo?.duplicateCount || 2} times`);
        }
      }
      
      console.log(`✅ [YT-SEARCH] Added ${newVideosCount} new videos from phrase "${phrase}"`);
    }
    
    // Count duplicates
    const duplicateStats = {};
    allVideos.forEach(video => {
      const count = video.duplicateCount || 1;
      duplicateStats[count] = (duplicateStats[count] || 0) + 1;
    });
    
    console.log(`\n🎉 [YT-SEARCH] Batch search completed!`);
    console.log(`📊 [YT-SEARCH] Total unique videos found: ${allVideos.length}`);
    console.log(`🔄 [YT-SEARCH] Duplicate statistics:`);
    Object.entries(duplicateStats).forEach(([count, videos]) => {
      console.log(`   - ${videos} videos appear ${count} time(s)`);
    });
    
    return allVideos;

  } catch (error) {
    console.error(`❌ [YT-SEARCH] Error in batch search:`, error);
    console.error(`🔍 [YT-SEARCH] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
};

/**
 * Add transcripts to videos array using Python server
 * @param {Array} videos - Array of video objects with videoId
 * @returns {Promise<Array>} Videos with transcripts added
 */
export const addTranscriptsToVideos = async (videos) => {
  console.log(`\n📝 [YT-SEARCH] Adding transcripts to ${videos.length} videos using Python server...`);
  
  try {
    const response = await fetch(`${TRANSCRIPT_SERVER_URL}/api/transcripts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videos: videos
      })
    });
    
    if (!response.ok) {
      console.error(`❌ [YT-SEARCH] HTTP error! Status: ${response.status} ${response.statusText}`);
      return videos; // Return original videos if transcript request fails
    }
    
    const result = await response.json();
    console.log(`📦 [YT-SEARCH] Python transcripts response:`, result);
    
    // Map transcript results back to videos
    const transcriptMap = {};
    if (result.transcripts) {
      result.transcripts.forEach(item => {
        transcriptMap[item.videoId] = item.transcript;
      });
    }
    
    // Add transcripts to videos
    const videosWithTranscripts = videos.map(video => ({
      ...video,
      transcript: transcriptMap[video.videoId] || null
    }));
    
    // Log transcript statistics
    const videosWithTranscript = videosWithTranscripts.filter(v => v.transcript);
    const videosWithoutTranscript = videosWithTranscripts.filter(v => !v.transcript);
    
    console.log(`\n📊 [YT-SEARCH] Transcript statistics:`);
    console.log(`   - Videos with transcript: ${videosWithTranscript.length}`);
    console.log(`   - Videos without transcript: ${videosWithoutTranscript.length}`);
    
    // Log videos with transcripts
    videosWithTranscript.forEach((video, index) => {
      console.log(`   ${index + 1}. "${video.title}" - ${video.transcript.length} characters`);
    });
    
    return videosWithTranscripts;
    
  } catch (error) {
    console.error(`❌ [YT-SEARCH] Error adding transcripts:`, error);
    return videos; // Return original videos if transcript request fails
  }
}; 