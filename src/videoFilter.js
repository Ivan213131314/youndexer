/**
 * Video relevance filter using GPT
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Filter videos based on user query using GPT
 * @param {Array} videos - Array of video objects with id, title, description, videoId
 * @param {string} userQuery - User's search query
 * @returns {Promise<Array>} Array of relevant video IDs
 */
export const filterVideosWithGPT = async (videos, userQuery) => {
  console.log(`\n🤖 [VIDEO FILTER] Starting GPT filtering for query: "${userQuery}"`);
  console.log(`📊 [VIDEO FILTER] Total videos to analyze: ${videos.length}`);

  try {
    // Prepare video data for GPT
    const videoData = videos.map((video, index) => ({
      id: index + 1, // Simple number starting from 1
      title: video.title,
      description: video.description
    }));

    console.log(`📋 [VIDEO FILTER] Video data to send to GPT:`);
    console.log(JSON.stringify(videoData, null, 2));

    // Create prompt for GPT
    const prompt = `You are a video relevance filter. Your task is to analyze a list of YouTube videos. Each video has an id (number), a title, a description, and a videoId. The goal is to return an array of ids of the most relevant videos based on the user query.

If the query is narrow or niche, return fewer ids (around 1–10). If the query is broad, return more (up to 30). Use your judgment to balance relevance and completeness. Ignore duplicate content — the list is already deduplicated.

Return ONLY a JSON array of ids. Do NOT explain your choices. Do NOT return anything else.

User query: "${userQuery}"

Videos to analyze:
${JSON.stringify(videoData, null, 2)}`;

    console.log(`📝 [VIDEO FILTER] Sending request to GPT...`);

    // Call GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000
    });

    const gptResponse = completion.choices[0].message.content;
    console.log(`✅ [VIDEO FILTER] GPT response received:`);
    console.log(gptResponse);

    // Parse JSON response
    let relevantIds;
    try {
      relevantIds = JSON.parse(gptResponse);
      
      if (!Array.isArray(relevantIds)) {
        console.error(`❌ [VIDEO FILTER] GPT returned non-array response:`, relevantIds);
        return [];
      }

      console.log(`🎯 [VIDEO FILTER] Successfully parsed ${relevantIds.length} relevant video IDs`);
      console.log(`📋 [VIDEO FILTER] Relevant IDs:`, relevantIds);

      return relevantIds;

    } catch (parseError) {
      console.error(`❌ [VIDEO FILTER] Failed to parse GPT response as JSON:`, parseError);
      console.error(`📄 [VIDEO FILTER] Raw response:`, gptResponse);
      return [];
    }

  } catch (error) {
    console.error(`❌ [VIDEO FILTER] Error during GPT filtering:`, error);
    console.error(`🔍 [VIDEO FILTER] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return [];
  }
};

/**
 * Get filtered videos based on GPT selection
 * @param {Array} allVideos - All videos array
 * @param {Array} relevantIds - Array of relevant video IDs from GPT
 * @returns {Array} Filtered videos array
 */
export const getFilteredVideos = (allVideos, relevantIds) => {
  console.log(`\n🔍 [VIDEO FILTER] Filtering videos based on GPT selection...`);
  
  const filteredVideos = allVideos.filter((video, index) => {
    const videoNumber = index + 1;
    return relevantIds.includes(videoNumber);
  });

  console.log(`✅ [VIDEO FILTER] Filtered ${filteredVideos.length} videos from ${allVideos.length} total`);
  
  return filteredVideos;
}; 