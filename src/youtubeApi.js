/**
 * YouTube API service for fetching video search results
 */

const YOUTUBE_API_KEY = 'AIzaSyCs3QZxVnZBltP2tn2_v8IkbK0_03zoaTU';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3/search';

/**
 * Fetch videos from YouTube API for a given search phrase
 * @param {string} phrase - Search phrase to look for
 * @param {number} limit - Maximum number of videos to return (default: 3)
 * @returns {Promise<Array>} Array of video objects
 */
export const fetchYouTubeVideos = async (phrase, limit = 10) => {
  console.log(`\n🔍 [YOUTUBE API] Starting search for phrase: "${phrase}"`);
  
  try {
    // Validate input
    if (!phrase || typeof phrase !== 'string') {
      console.error('❌ [YOUTUBE API] Invalid phrase provided:', phrase);
      return [];
    }

    const trimmedPhrase = phrase.trim();
    if (trimmedPhrase.length === 0) {
      console.error('❌ [YOUTUBE API] Empty phrase provided');
      return [];
    }

    // Encode the phrase for URL
    const encodedPhrase = encodeURIComponent(trimmedPhrase);
    const requestUrl = `${YOUTUBE_API_BASE_URL}?key=${YOUTUBE_API_KEY}&part=snippet&q=${encodedPhrase}&type=video&maxResults=${limit}`;
    
    console.log(`🌐 [YOUTUBE API] Making request to: ${YOUTUBE_API_BASE_URL}`);
    console.log(`📝 [YOUTUBE API] Original phrase: "${trimmedPhrase}"`);
    console.log(`🔗 [YOUTUBE API] Encoded phrase: "${encodedPhrase}"`);

    // Make the API request
    const startTime = Date.now();
    
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`⏱️ [YOUTUBE API] Request completed in ${responseTime}ms`);
    console.log(`📊 [YOUTUBE API] Response status: ${response.status} ${response.statusText}`);

    // Check if response is ok
    if (!response.ok) {
      console.error(`❌ [YOUTUBE API] HTTP error! Status: ${response.status} ${response.statusText}`);
      
      // Try to get error details
      try {
        const errorText = await response.text();
        console.error(`📄 [YOUTUBE API] Error response body:`, errorText);
      } catch (e) {
        console.error(`📄 [YOUTUBE API] Could not read error response body:`, e);
      }
      
      return [];
    }

    // Parse response
    console.log(`📥 [YOUTUBE API] Parsing JSON response...`);
    const result = await response.json();
    console.log(`📦 [YOUTUBE API] API response:`, result);

    // Extract videos from the YouTube API response
    const videos = result.items || [];
    console.log(`🎬 [YOUTUBE API] Found ${videos.length} total videos in response`);

    // Transform YouTube API format to our format
    const transformedVideos = videos.map(video => ({
      id: video.id.videoId,
      videoId: video.id.videoId,
      title: video.snippet.title,
      description: video.snippet.description,
      url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
      thumbnail: video.snippet.thumbnails?.default?.url || '',
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt
    }));

    console.log(`✅ [YOUTUBE API] ${transformedVideos.length} videos transformed`);

    // Log video details
    transformedVideos.forEach((video, index) => {
      console.log(`🎥 [YOUTUBE API] Video ${index + 1}: "${video.title}" (ID: ${video.videoId})`);
    });

    console.log(`✅ [YOUTUBE API] Successfully fetched videos for "${trimmedPhrase}"`);
    return transformedVideos;

  } catch (error) {
    console.error(`❌ [YOUTUBE API] Error fetching videos for phrase "${phrase}":`, error);
    console.error(`🔍 [YOUTUBE API] Error details:`, {
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
 * @param {number} videosPerPhrase - Number of videos to fetch per phrase (default: 3)
 * @returns {Promise<Array>} Array of unique video objects
 */
export const searchVideosWithPhrases = async (phrases, videosPerPhrase = 10) => {
  console.log(`\n🚀 [YOUTUBE API] Starting batch search with ${phrases.length} phrases`);
  
  const allVideos = [];
  const seenVideoIds = new Set();
  const duplicateCount = new Map(); // Track how many times each video appears
  
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    console.log(`\n📝 [YOUTUBE API] Processing phrase ${i + 1}/${phrases.length}: "${phrase}"`);
    
    const videos = await fetchYouTubeVideos(phrase, videosPerPhrase);
    
    let newVideosCount = 0;
    for (const video of videos) {
      const videoId = video.id || video.videoId;
      
      if (!seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        allVideos.push({
          ...video,
          searchPhrase: phrase,
          phraseIndex: i,
          duplicateCount: 1
        });
        newVideosCount++;
      } else {
        // Video already exists, increment duplicate count
        const existingVideo = allVideos.find(v => (v.id || v.videoId) === videoId);
        if (existingVideo) {
          existingVideo.duplicateCount = (existingVideo.duplicateCount || 1) + 1;
        }
        console.log(`🔄 [YOUTUBE API] Duplicate video found: "${video.title}" (ID: ${videoId}) - now appears ${existingVideo?.duplicateCount || 2} times`);
      }
    }
    
    console.log(`✅ [YOUTUBE API] Added ${newVideosCount} new videos from phrase "${phrase}"`);
  }
  
  // Count duplicates
  const duplicateStats = {};
  allVideos.forEach(video => {
    const count = video.duplicateCount || 1;
    duplicateStats[count] = (duplicateStats[count] || 0) + 1;
  });
  
  console.log(`\n🎉 [YOUTUBE API] Batch search completed!`);
  console.log(`📊 [YOUTUBE API] Total unique videos found: ${allVideos.length}`);
  console.log(`🔄 [YOUTUBE API] Duplicate statistics:`);
  Object.entries(duplicateStats).forEach(([count, videos]) => {
    console.log(`   - ${videos} videos appear ${count} time(s)`);
  });
  
  return allVideos;
}; 