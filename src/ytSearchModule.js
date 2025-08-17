/**
 * YouTube search module - client side
 * Communicates with server that uses yt-search library
 */

const SERVER_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

/**
 * Fetch videos from YouTube via server API
 * @param {string} phrase - Search phrase to look for
 * @param {number} limit - Maximum number of videos to return (default: 10)
 * @returns {Promise<Array>} Array of video objects
 */
export const fetchVideosByPhrase = async (phrase, limit = 10) => {
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
     
     const apiUrl = process.env.NODE_ENV === 'production' 
       ? `/api/search?q=${encodeURIComponent(trimmedPhrase)}&limit=${limit}`
       : `${SERVER_URL}/api/search?q=${encodeURIComponent(trimmedPhrase)}&limit=${limit}`;
     
     console.log(`🌐 [YT-SEARCH] Making request to: ${apiUrl}`);
     
     const response = await fetch(apiUrl, {
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
    throw error; // Пробрасываем ошибку вместо возврата пустого массива
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
    throw error; // Пробрасываем ошибку вместо возврата пустого массива
  }
};

/**
 * Add transcripts to videos array using individual Supadata requests
 * @param {Array} videos - Array of video objects with videoId
 * @returns {Promise<Array>} Videos with transcripts added
 */
export const addTranscriptsToVideos = async (videos, onProgressCallback = null, onStepProgress = null) => {
  console.log(`\n📝 [YT-SEARCH] Adding transcripts to ${videos.length} videos using individual Supadata requests...`);
  
  try {
    // Импортируем Supadata
    const { Supadata } = await import('@supadata/js');
    
    // Initialize the client
    const supadata = new Supadata({
      apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
    });
    
    // Получаем список videoId
    const videoIds = videos.map(video => video.videoId);
    
    console.log(`🚀 [SUPADATA] Получаем transcriptы для ${videoIds.length} видео по отдельности`);
    
    const results = [];
    const videosWithTranscripts = [...videos]; // Копируем массив для инкрементального обновления
    
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      const videoTitle = videos.find(v => v.videoId === videoId)?.title || videoId;
      console.log(`📝 [SUPADATA] Обрабатываем видео ${i + 1}/${videoIds.length}: ${videoId}`);
      
      // Обновляем прогресс шага
      if (onStepProgress) {
        onStepProgress({
          step: 'transcribing',
          details: `Getting transcript for video "${videoTitle}" (${i + 1}/${videoIds.length})`
        });
      }
      
      try {
        // Get transcript for a single video
        const transcriptResult = await supadata.youtube.transcript({
          url: `https://www.youtube.com/watch?v=${videoId}`,
          lang: 'en',
          text: true
        });
        
        console.log(`✅ [SUPADATA] Transcript получен для видео: ${videoId}`);
        
        // Извлекаем текст из объекта transcript
        let transcriptText = null;
        if (transcriptResult && typeof transcriptResult === 'object') {
          // Если это объект с полями lang, availableLangs, content
          if (transcriptResult.content) {
            transcriptText = transcriptResult.content;
          } else if (transcriptResult.text) {
            transcriptText = transcriptResult.text;
          } else {
            // Если это строка, используем как есть
            transcriptText = transcriptResult;
          }
        } else if (typeof transcriptResult === 'string') {
          transcriptText = transcriptResult;
        }
        
        // Дополнительная проверка - убеждаемся что transcriptText это строка
        if (transcriptText && typeof transcriptText === 'object') {
          console.log(`⚠️ [SUPADATA] Transcript для видео ${videoId} все еще объект:`, transcriptText);
          // Пытаемся извлечь текст из объекта
          if (transcriptText.content) {
            transcriptText = transcriptText.content;
          } else if (transcriptText.text) {
            transcriptText = transcriptText.text;
          } else {
            // Если не можем извлечь, устанавливаем null
            transcriptText = null;
          }
        }
        
        // Финальная проверка - только строки или null
        if (transcriptText && typeof transcriptText !== 'string') {
          console.log(`❌ [SUPADATA] Не удалось извлечь строку из transcript для видео ${videoId}:`, transcriptText);
          transcriptText = null;
        }
        
        results.push({
          videoId: videoId,
          transcript: transcriptText
        });
        
        // Обновляем видео с transcript в массиве
        const videoIndex = videosWithTranscripts.findIndex(v => v.videoId === videoId);
        if (videoIndex !== -1) {
          videosWithTranscripts[videoIndex] = {
            ...videosWithTranscripts[videoIndex],
            transcript: transcriptText,
            // Убеждаемся что есть все необходимые поля
            thumbnail: videosWithTranscripts[videoIndex].thumbnail || `https://img.youtube.com/vi/${videoId}/default.jpg`,
            url: videosWithTranscripts[videoIndex].url || `https://www.youtube.com/watch?v=${videoId}`,
            author: videosWithTranscripts[videoIndex].author || videosWithTranscripts[videoIndex].channelTitle || 'Unknown Channel',
            duration: videosWithTranscripts[videoIndex].duration || 'N/A',
            views: videosWithTranscripts[videoIndex].views || 'N/A',
            publishedAt: videosWithTranscripts[videoIndex].publishedAt || 'N/A'
          };
          
          // Вызываем callback для инкрементального обновления UI
          if (onProgressCallback) {
            onProgressCallback([...videosWithTranscripts]);
          }
        }
        
        // Небольшая задержка между запросами
        if (i < videoIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
      } catch (error) {
        console.error(`❌ [SUPADATA] Ошибка при обработке видео ${videoId}:`, error);
        results.push({
          videoId: videoId,
          transcript: null
        });
        
        // Обновляем видео без transcript в массиве
        const videoIndex = videosWithTranscripts.findIndex(v => v.videoId === videoId);
        if (videoIndex !== -1) {
          videosWithTranscripts[videoIndex] = {
            ...videosWithTranscripts[videoIndex],
            transcript: null,
            // Убеждаемся что есть все необходимые поля
            thumbnail: videosWithTranscripts[videoIndex].thumbnail || `https://img.youtube.com/vi/${videoId}/default.jpg`,
            url: videosWithTranscripts[videoIndex].url || `https://www.youtube.com/watch?v=${videoId}`,
            author: videosWithTranscripts[videoIndex].author || videosWithTranscripts[videoIndex].channelTitle || 'Unknown Channel',
            duration: videosWithTranscripts[videoIndex].duration || 'N/A',
            views: videosWithTranscripts[videoIndex].views || 'N/A',
            publishedAt: videosWithTranscripts[videoIndex].publishedAt || 'N/A'
          };
          
          // Вызываем callback для инкрементального обновления UI
          if (onProgressCallback) {
            onProgressCallback([...videosWithTranscripts]);
          }
        }
      }
    }
    
    console.log(`✅ [SUPADATA] Обработано ${results.length} видео`);
    
    // Финальная проверка - убеждаемся что все transcriptы это строки или null
    videosWithTranscripts.forEach(video => {
      if (video.transcript && typeof video.transcript !== 'string') {
        console.log(`⚠️ [YT-SEARCH] Исправляем transcript для видео ${video.videoId}:`, video.transcript);
        if (video.transcript.content) {
          video.transcript = video.transcript.content;
        } else if (video.transcript.text) {
          video.transcript = video.transcript.text;
        } else {
          video.transcript = null;
        }
      }
      
      // Дополнительная проверка - логируем тип transcript
      if (video.transcript) {
        console.log(`🔍 [YT-SEARCH] Transcript для видео ${video.videoId} имеет тип: ${typeof video.transcript}`);
        if (typeof video.transcript === 'object') {
          console.log(`❌ [YT-SEARCH] ОШИБКА: Transcript для видео ${video.videoId} все еще объект:`, video.transcript);
        }
      }
    });
    
    // Логируем статистику
    const videosWithTranscript = videosWithTranscripts.filter(v => v.transcript);
    const videosWithoutTranscript = videosWithTranscripts.filter(v => !v.transcript);
    
    console.log(`\n📊 [YT-SEARCH] Transcript statistics:`);
    console.log(`   - Videos with transcript: ${videosWithTranscript.length}`);
    console.log(`   - Videos without transcript: ${videosWithoutTranscript.length}`);
    
    // Логируем видео с transcriptами
    videosWithTranscript.forEach((video, index) => {
      console.log(`   ${index + 1}. "${video.title}" - ${video.transcript.length} characters`);
    });
    
    return videosWithTranscripts;
    
  } catch (error) {
    console.error(`❌ [YT-SEARCH] Error adding transcripts:`, error);
    console.error(`🔍 [YT-SEARCH] Error details:`, {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    return videos; // Return original videos if transcript request fails
  }
}; 