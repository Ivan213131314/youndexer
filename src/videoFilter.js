/**
 * Video relevance filter using OpenRouter API
 */

// Создаем OpenRouter клиент только когда он нужен
const createOpenRouterClient = () => {
  const apiKey = process.env.REACT_APP_OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ REACT_APP_OPEN_ROUTER_API_KEY не установлен. Видео фильтрация будет отключена.');
    return null;
  }
  return { apiKey };
};

/**
 * Filter videos based on user query using OpenRouter API
 * @param {Array} videos - Array of video objects with id, title, description, videoId
 * @param {string} userQuery - User's search query
 * @param {string} model - Model to use for filtering (default: 'openai/gpt-4o')
 * @returns {Promise<Array>} Array of relevant video IDs
 */
export const filterVideosWithGPT = async (videos, userQuery, model = 'openai/gpt-4o') => {
  console.log(`\n🤖 [VIDEO FILTER] Starting OpenRouter filtering for query: "${userQuery}"`);
  console.log(`📊 [VIDEO FILTER] Total videos to analyze: ${videos.length}`);
  console.log(`🤖 [VIDEO FILTER] Using model: ${model}`);

  // Создаем OpenRouter клиент
  const openRouter = createOpenRouterClient();
  if (!openRouter) {
    console.warn('⚠️ [VIDEO FILTER] OpenRouter клиент не инициализирован. Возвращаем все видео.');
    return videos.map((_, index) => index + 1);
  }

  try {
    // Prepare video data for LLM
    const videoData = videos.map((video, index) => ({
      id: index + 1, // Simple number starting from 1
      title: video.title,
      description: video.description,
      videoId: video.videoId
    }));

    console.log(`📋 [VIDEO FILTER] Video data to send to LLM:`);
    console.log(JSON.stringify(videoData, null, 2));

    // Create prompt for LLM
    const prompt = `You are a video relevance filter. Your task is to analyze a list of YouTube videos. Each video has an id (number), a title, a description, and a videoId. The goal is to return an array of ids of the most relevant videos based on the user query.

If the query is narrow or niche, return fewer ids (around 1–10). If the query is broad, return more (up to 30). Use your judgment to balance relevance and completeness. Ignore duplicate content — the list is already deduplicated.

Return ONLY a JSON array of ids. Do NOT explain your choices. Do NOT return anything else.

User query: "${userQuery}"

Videos to analyze:
${JSON.stringify(videoData, null, 2)}`;

    console.log(`📝 [VIDEO FILTER] Sending request to OpenRouter...`);

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouter.apiKey}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'YouTube Searcher',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
    }

    const completion = await response.json();
    const llmResponse = completion.choices[0].message.content;
    console.log(`✅ [VIDEO FILTER] OpenRouter response received:`);
    console.log(llmResponse);

    // Parse JSON response - очищаем от markdown разметки
    let relevantIds;
    try {
      // Убираем markdown разметку (```json, ```, и т.д.)
      const cleanedResponse = llmResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
      
      console.log(`🧹 [VIDEO FILTER] Cleaned response:`, cleanedResponse);
      
      relevantIds = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(relevantIds)) {
        console.error(`❌ [VIDEO FILTER] LLM returned non-array response:`, relevantIds);
        return [];
      }

      console.log(`🎯 [VIDEO FILTER] Successfully parsed ${relevantIds.length} relevant video IDs`);
      console.log(`📋 [VIDEO FILTER] Relevant IDs:`, relevantIds);

      return relevantIds;

    } catch (parseError) {
      console.error(`❌ [VIDEO FILTER] Failed to parse LLM response as JSON:`, parseError);
      console.error(`📄 [VIDEO FILTER] Raw response:`, llmResponse);
      return [];
    }

  } catch (error) {
    console.error(`❌ [VIDEO FILTER] Error during OpenRouter filtering:`, error);
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
  console.log(`📋 [VIDEO FILTER] Filtered videos array:`, filteredVideos);
  
  return filteredVideos;
}; 