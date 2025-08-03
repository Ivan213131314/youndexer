/**
 * Filmot API service for fetching YouTube video search results
 * Uses Vercel API route to avoid CORS issues
 */

const API_BASE_URL = 'https://api.allorigins.win/raw?url=https://filmot.com/api/v1/search';

/**
 * Fetch videos from Filmot API for a given search phrase
 * @param {string} phrase - Search phrase to look for
 * @param {number} limit - Maximum number of videos to return (default: 3)
 * @returns {Promise<Array>} Array of video objects
 */
export const fetchFilmotVideos = async (phrase, limit = 3) => {
  console.log(`\n🔍 [FILMOT API] Starting search for phrase: "${phrase}"`);
  
  try {
    // Validate input
    if (!phrase || typeof phrase !== 'string') {
      console.error('❌ [FILMOT API] Invalid phrase provided:', phrase);
      return [];
    }

    const trimmedPhrase = phrase.trim();
    if (trimmedPhrase.length === 0) {
      console.error('❌ [FILMOT API] Empty phrase provided');
      return [];
    }

    // Encode the phrase for URL
    const encodedPhrase = encodeURIComponent(trimmedPhrase);
    const requestUrl = `${API_BASE_URL}&q=${encodedPhrase}`;
    
    console.log(`🌐 [FILMOT API] Making request to: ${requestUrl}`);
    console.log(`📝 [FILMOT API] Original phrase: "${trimmedPhrase}"`);
    console.log(`🔗 [FILMOT API] Encoded phrase: "${encodedPhrase}"`);

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
    
    console.log(`⏱️ [FILMOT API] Request completed in ${responseTime}ms`);
    console.log(`📊 [FILMOT API] Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 [FILMOT API] Response headers:`, Object.fromEntries(response.headers.entries()));

    // Check if response is ok
    if (!response.ok) {
      console.error(`❌ [FILMOT API] HTTP error! Status: ${response.status} ${response.statusText}`);
      
      // Try to get error details
      try {
        const errorText = await response.text();
        console.error(`📄 [FILMOT API] Error response body:`, errorText);
      } catch (e) {
        console.error(`📄 [FILMOT API] Could not read error response body:`, e);
      }
      
      return [];
    }

    // Parse response
    console.log(`📥 [FILMOT API] Parsing JSON response...`);
    const result = await response.json();
    console.log(`📦 [FILMOT API] API response:`, result);

    // Extract videos from the Filmot API response
    const filmotData = result;
    const videos = filmotData.videos || filmotData.results || filmotData.data || [];
    console.log(`🎬 [FILMOT API] Found ${videos.length} total videos in response`);

    // Validate video structure
    const validVideos = videos.filter(video => {
      if (!video || typeof video !== 'object') {
        console.warn(`⚠️ [FILMOT API] Invalid video object:`, video);
        return false;
      }
      
      if (!video.id && !video.videoId) {
        console.warn(`⚠️ [FILMOT API] Video missing ID:`, video);
        return false;
      }
      
      return true;
    });

    console.log(`✅ [FILMOT API] ${validVideos.length} valid videos found`);

    // Limit results
    const limitedVideos = validVideos.slice(0, limit);
    console.log(`📊 [FILMOT API] Returning ${limitedVideos.length} videos (limited to ${limit})`);

    // Log video details
    limitedVideos.forEach((video, index) => {
      const videoId = video.id || video.videoId || 'unknown';
      const title = video.title || video.name || 'No title';
      console.log(`🎥 [FILMOT API] Video ${index + 1}: "${title}" (ID: ${videoId})`);
    });

    console.log(`✅ [FILMOT API] Successfully fetched videos for "${trimmedPhrase}"`);
    return limitedVideos;

  } catch (error) {
    console.error(`❌ [FILMOT API] Error fetching videos for phrase "${phrase}":`, error);
    console.error(`🔍 [FILMOT API] Error details:`, {
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
export const searchVideosWithPhrases = async (phrases, videosPerPhrase = 3) => {
  console.log(`\n🚀 [FILMOT API] Starting batch search with ${phrases.length} phrases`);
  
  const allVideos = [];
  const seenVideoIds = new Set();
  
  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    console.log(`\n📝 [FILMOT API] Processing phrase ${i + 1}/${phrases.length}: "${phrase}"`);
    
    const videos = await fetchFilmotVideos(phrase, videosPerPhrase);
    
    let newVideosCount = 0;
    for (const video of videos) {
      const videoId = video.id || video.videoId;
      
      if (!seenVideoIds.has(videoId)) {
        seenVideoIds.add(videoId);
        allVideos.push({
          ...video,
          searchPhrase: phrase,
          phraseIndex: i
        });
        newVideosCount++;
      } else {
        console.log(`🔄 [FILMOT API] Duplicate video skipped: "${video.title}" (ID: ${videoId})`);
      }
    }
    
    console.log(`✅ [FILMOT API] Added ${newVideosCount} new videos from phrase "${phrase}"`);
  }
  
  console.log(`\n🎉 [FILMOT API] Batch search completed!`);
  console.log(`📊 [FILMOT API] Total unique videos found: ${allVideos.length}`);
  
  return allVideos;
}; 