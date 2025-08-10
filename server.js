// Загружаем переменные окружения

console.log('⬅️ До dotenv');
require('dotenv').config();
console.log('➡️ После dotenv');
console.log('[CHECK] OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
console.log('[CHECK] REACT_APP_OPENAI_API_KEY:', process.env.REACT_APP_OPENAI_API_KEY);


const express = require('express');
const cors = require('cors');
const yts = require('yt-search');
const { getTranscriptSummary } = require('./transcript-summarizer.cjs');


const app = express();
const PORT = process.env.PORT || 3001;
const searchVideoCount = 1;  // кол-во видео возвращаемых сервером

// Supadata API конфигурация
const SUPADATA_API_KEY = "sd_cf39c3a6069af680097faf6f996b8c16"; // Замените на ваш API ключ
const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

// Динамический импорт Supadata функций
let createTranscriptBatch, checkBatchStatus;
(async () => {
    const supadataModule = await import('./src/supadata-client.js');
    createTranscriptBatch = supadataModule.createTranscriptBatch;
    checkBatchStatus = supadataModule.checkBatchStatus;
    console.log('✅ [SUPADATA] Функции загружены');
})().catch(console.error);

// CORS middleware - настройка для продакшена
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

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



// Supadata транскрипции функции
function extractVideoId(urlOrId) {
    if (urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be')) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/
        ];
        
        for (const pattern of patterns) {
            const match = urlOrId.match(pattern);
            if (match) {
                return match[1];
            }
        }
    }
    return urlOrId;
}

async function getVideoTranscriptSupadata(videoId) {
    try {
        // Очищаем video ID
        const cleanVideoId = extractVideoId(videoId);
        
        // Формируем YouTube URL
        const youtubeUrl = `https://www.youtube.com/watch?v=${cleanVideoId}`;
        
        // Заголовки для Supadata API
        const headers = {
            "x-api-key": SUPADATA_API_KEY,
            "Content-Type": "application/json"
        };
        
        // Данные для запроса
        const payload = {
            url: youtubeUrl
        };
        
        console.log(`🔍 [SUPADATA] Отправляем запрос к Supadata для видео: ${youtubeUrl}`);
        
        // Отправляем запрос к Supadata API
        const response = await fetch(`${SUPADATA_BASE_URL}/youtube/transcript?url=${encodeURIComponent(youtubeUrl)}`, {
            method: 'GET',
            headers: headers
        });
        
        console.log(`📡 [SUPADATA] Ответ от Supadata API:`);
        console.log(`   Status Code: ${response.status}`);
        
        const responseText = await response.text();
        console.log(`   Response: ${responseText}`);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            const transcript = data.content || '';
            
            return {
                success: true,
                transcript: transcript,
                video_id: cleanVideoId,
                supadata_response: data
            };
        } else {
            return {
                success: false,
                error: `Supadata API error: ${response.status} - ${responseText}`,
                video_id: cleanVideoId
            };
        }
        
    } catch (error) {
        console.log(`❌ [SUPADATA] Ошибка при получении транскрипции: ${error.message}`);
        return {
            success: false,
            error: error.message,
            video_id: videoId
        };
    }
}

// Эндпоинт для получения транскрипции одного видео
app.post('/api/transcript', async (req, res) => {
    try {
        const { videoId } = req.body;
        
        if (!videoId) {
            return res.status(400).json({ error: 'videoId is required' });
        }
        
        const result = await getVideoTranscriptSupadata(videoId);
        res.json(result);
        
    } catch (error) {
        console.error('[SUPADATA] Ошибка в /api/transcript:', error);
        res.status(500).json({ error: error.message });
    }
});



// Эндпоинт для получения транскрипций нескольких видео через batch API
app.post('/api/transcripts', async (req, res) => {
    try {
        const { videos } = req.body;
        
        if (!videos || !Array.isArray(videos)) {
            return res.status(400).json({ error: 'videos array is required' });
        }
        
        console.log(`🧪 [SUPADATA] Обрабатываем ${videos.length} видео через batch API`);
        
        // Извлекаем video IDs
        const videoIds = videos
            .map(video => video.videoId || video.id)
            .filter(id => id);
        
        if (videoIds.length === 0) {
            return res.json({ transcripts: [] });
        }
        
        // Проверяем что функции загружены
        if (!createTranscriptBatch || !checkBatchStatus) {
            throw new Error('Supadata функции еще не загружены');
        }
        
        // Создаем batch job
        const jobId = await createTranscriptBatch(videoIds);
        
        // Проверяем статус с интервалом и retry логикой
        let attempts = 0;
        const maxAttempts = 30; // максимум 30 попыток (30 секунд)
        const retryDelay = 3000; // 3 секунды между попытками
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 5; // максимум 5 ошибок подряд
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`⏳ [SUPADATA] Проверяем статус batch job (попытка ${attempts}/${maxAttempts})`);
            
            try {
                // Добавляем таймаут для каждого запроса
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Supadata request timeout')), 10000);
                });
                
                const batchResult = await Promise.race([
                    checkBatchStatus(jobId),
                    timeoutPromise
                ]);
                consecutiveErrors = 0; // Сбрасываем счетчик ошибок при успехе
                
                switch (batchResult.status) {
                    case 'completed':
                        console.log(`✅ [SUPADATA] Batch job завершен!`);
                        console.log(`📊 [SUPADATA] Статистика: ${batchResult.stats.succeeded}/${batchResult.stats.total} успешно, ${batchResult.stats.failed} неудачно`);
                        
                        // Преобразуем результаты в нужный формат
                        const results = batchResult.results.map(result => ({
                            videoId: result.videoId,
                            transcript: result.transcript ? result.transcript.content : null,
                            error: result.errorCode || null,
                            supadata_response: result
                        }));
                        
                        return res.json({ 
                            transcripts: results,
                            batchJobId: jobId 
                        });
                        
                    case 'failed':
                        throw new Error(`Batch job failed: ${batchResult.error || 'Unknown error'}`);
                        
                    case 'queued':
                        console.log(`⏸️ [SUPADATA] Job в очереди, ждем ${retryDelay/1000}с...`);
                        break;
                        
                    case 'active':
                        console.log(`🔄 [SUPADATA] Job активен, обрабатывается... ждем ${retryDelay/1000}с`);
                        break;
                        
                    default:
                        console.log(`❓ [SUPADATA] Неизвестный статус: ${batchResult.status}, ждем ${retryDelay/1000}с`);
                        break;
                }
                
            } catch (error) {
                consecutiveErrors++;
                console.log(`❌ [SUPADATA] Ошибка проверки статуса (${consecutiveErrors}/${maxConsecutiveErrors}): ${error.message}`);
                
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    throw new Error(`Слишком много ошибок подряд (${consecutiveErrors}). Последняя ошибка: ${error.message}`);
                }
                
                // При ошибке ждем дольше
                console.log(`⏳ [SUPADATA] Ждем ${retryDelay*2/1000}с перед повтором...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay * 2));
                continue;
            }
            
            // Ждем перед следующей проверкой
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
        
        throw new Error('Batch job timeout - не удалось получить результаты за 30 секунд');
        
    } catch (error) {
        console.error('[SUPADATA] Ошибка в /api/transcripts:', error);
        
        // Fallback: возвращаем видео без транскриптов
        console.log('🔄 [SUPADATA] Fallback: возвращаем видео без транскриптов');
        const fallbackResults = videos.map(video => ({
            videoId: video.videoId || video.id,
            transcript: null,
            error: 'Supadata API недоступен',
            supadata_response: null
        }));
        
        res.json({ 
            transcripts: fallbackResults,
            batchJobId: null 
        });
    }
});

// Новый endpoint для создания резюме
app.post('/api/summarize-transcripts', async (req, res) => {
  try {
    const { jobId, userQuery } = req.body;
    
    if (!jobId || !userQuery) {
      return res.status(400).json({ 
        error: 'Missing required parameters: jobId and userQuery' 
      });
    }
    
    console.log(`🔍 [API] Creating summary for jobId: ${jobId}, query: "${userQuery}"`);
    
    const result = await getTranscriptSummary(jobId, userQuery);
    
    console.log(`✅ [API] Summary created successfully`);
    console.log(`📊 [API] Results:`, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ [API] Error creating summary:', error.message);
    res.status(500).json({ 
      error: 'Failed to create summary',
      details: error.message 
    });
  }
});

// Новый endpoint для создания резюме из видео напрямую
app.post('/api/summarize-videos', async (req, res) => {
  try {
    const { videos, userQuery, model = 'openai/gpt-4o' } = req.body;
    
    if (!videos || !Array.isArray(videos) || !userQuery) {
      return res.status(400).json({ 
        error: 'Missing required parameters: videos array and userQuery' 
      });
    }
    
    console.log(`🔍 [API] Creating summary for ${videos.length} videos, query: "${userQuery}", model: "${model}"`);
    
    // Фильтруем видео с transcriptами
    const videosWithTranscripts = videos.filter(video => video.transcript);
    
    if (videosWithTranscripts.length === 0) {
      return res.status(400).json({ 
        error: 'No videos with transcripts found' 
      });
    }
    
    console.log(`📝 [API] Found ${videosWithTranscripts.length} videos with transcripts`);
    
    // Создаем текст для анализа из всех transcriptов
    const allTranscripts = videosWithTranscripts.map(video => 
      `Video: ${video.title}\nAuthor: ${video.author}\nTranscript: ${video.transcript}\n\n`
    ).join('---\n');
    
    console.log('📄 [API] ALL_TRANSCRIPTS CONTENT:');
    console.log('='.repeat(80));
    console.log(allTranscripts);
    console.log('='.repeat(80));
    console.log(`📊 [API] Total length of allTranscripts: ${allTranscripts.length} characters`);
    console.log(`📊 [API] Size in KB: ${(allTranscripts.length * 2) / 1024} KB`);
    console.log(`📊 [API] Size in MB: ${(allTranscripts.length * 2) / (1024 * 1024)} MB`);
    
    // Используем OpenRouter API для создания резюме с выбранной моделью
    const openRouterApiKey = process.env.REACT_APP_OPEN_ROUTER_API_KEY;
    if (!openRouterApiKey) {
      return res.status(500).json({ 
        error: 'OpenRouter API key not configured. Please set REACT_APP_OPEN_ROUTER_API_KEY in .env file' 
      });
    }
    
    const prompt = `Based on the following YouTube video transcripts, generate a clear and structured summary that directly answers the user's request:"${userQuery}. Make summary only with user's request language. Summary language has to be the same as user request."

Instructions for generating the summary:
1. Start by answering the user's query as directly as possible.
2. Use only information from the transcripts. Do not invent or assume anything not found in the transcripts.
3. Identify and include the most important points from each transcript that relate to the user's query.
4. If multiple transcripts discuss similar ideas or themes, highlight those recurring points.
5. If applicable, provide practical conclusions, lessons, or recommendations based on the transcripts.
6. refer to the videos themselves (e.g., titles, URLs, creators, or platforms).
8. Use emojis, markers for visual design.
Transciptions:
${allTranscripts}`;

    // Отправляем запрос к OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
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
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || response.statusText;
      
      console.log(`❌ [API] OpenRouter API error: ${errorMessage}`);
      console.log(`🔍 [API] Checking if this is a context length error...`);
      
      // Проверяем, является ли ошибка связанной с превышением контекста
      if (errorMessage.includes('maximum context length') || 
          errorMessage.includes('context_length_exceeded') || 
          errorMessage.includes('tokens. However, you requested about') ||
          errorMessage.includes('Please reduce the length')) {
        console.log(`⚠️ [API] ✅ CONFIRMED: Context length exceeded. Finding longest video and creating individual summary...`);
        
        // Находим самое длинное видео по количеству символов в транскрипте
        let longestVideo = null;
        let maxLength = 0;
        let longestIndex = -1;
        
        videosWithTranscripts.forEach((video, index) => {
          const transcriptLength = video.transcript ? video.transcript.length : 0;
          if (transcriptLength > maxLength) {
            maxLength = transcriptLength;
            longestVideo = video;
            longestIndex = index;
          }
        });
        
        if (!longestVideo) {
          throw new Error(`No video with transcript found for individual processing`);
        }
        
        console.log(`📝 [API] Longest video: "${longestVideo.title}" with ${maxLength} characters`);
        
        // Создаем индивидуальное резюме для самого длинного видео
        const individualSummaryPrompt = `Create a very concise summary of this YouTube video transcript. Focus ONLY on the main points and key insights. Keep it under 200 words and be very brief.

IMPORTANT LANGUAGE INSTRUCTION: ${languageConfig.instruction}

Video: ${longestVideo.title}
Author: ${longestVideo.author}
Transcript: ${longestVideo.transcript}`;

        const individualResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterApiKey}`,
            'HTTP-Referer': 'http://localhost:3001',
            'X-Title': 'YouTube Searcher',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: individualSummaryPrompt
              }
            ],
            max_tokens: 400,
            temperature: 0.5
          })
        });

        if (!individualResponse.ok) {
          throw new Error(`Failed to create individual summary for longest video`);
        }

        const individualCompletion = await individualResponse.json();
        const individualSummary = individualCompletion.choices[0].message.content;
        
        console.log(`✅ [API] Individual summary created for "${longestVideo.title}"`);
        console.log(`📄 [API] Summary length: ${individualSummary.length} characters`);
        console.log(`📝 [API] Summary content preview: "${individualSummary.substring(0, 200)}..."`);
        
        // Заменяем транскрипт самого длинного видео на его резюме
        const updatedVideosWithTranscripts = [...videosWithTranscripts];
        updatedVideosWithTranscripts[longestIndex] = {
          ...longestVideo,
          transcript: individualSummary,
          isTranscriptSummarized: true // Добавляем флаг что это summary а не оригинальный transcript
        };
        
        console.log(`🔄 [API] Updated video data for "${longestVideo.title}":`);
        console.log(`   - Original transcript length: ${maxLength} characters`);
        console.log(`   - New summary length: ${individualSummary.length} characters`);
        console.log(`   - isTranscriptSummarized: ${updatedVideosWithTranscripts[longestIndex].isTranscriptSummarized}`);
        
        // Создаем новый текст для анализа с обновленными транскриптами
        const updatedAllTranscripts = updatedVideosWithTranscripts.map(video => 
          `Video: ${video.title}\nAuthor: ${video.author}\nTranscript: ${video.transcript}\n\n`
        ).join('---\n');
        
        console.log(`📊 [API] Updated transcripts length: ${updatedAllTranscripts.length} characters`);
        console.log(`📊 [API] Reduced from ${allTranscripts.length} to ${updatedAllTranscripts.length} characters`);
        
        const updatedPrompt = `Based on the following YouTube video transcripts, generate a clear and structured summary that directly answers the user's request:"${userQuery}. Make summary with user's request language"

Instructions for generating the summary:
1. Start by answering the user's query as directly as possible.
2. Use only information from the transcripts. Do not invent or assume anything not found in the transcripts.
3. Identify and include the most important points from each transcript that relate to the user's query.
4. If multiple transcripts discuss similar ideas or themes, highlight those recurring points.
5. If applicable, provide practical conclusions, lessons, or recommendations based on the transcripts.
6. Do not refer to the videos themselves (e.g., titles, URLs, creators, or platforms). Focus only on the content.
7. Write in simple, natural English. Avoid overly formal or academic tone.
8. Use formating the output with bullet points, emojis, or markdown. Use plain text and paragraphs only.
Transciptions:
${updatedAllTranscripts}`;

        // Рекурсивная функция для обработки длинного контента
        const processLongContent = async (videosToProcess, attempt = 1, maxAttempts = 5) => {
          console.log(`🔄 [API] Processing attempt ${attempt}/${maxAttempts} with ${videosToProcess.length} videos`);
          
          const currentAllTranscripts = videosToProcess.map(video => 
            `Video: ${video.title}\nAuthor: ${video.author}\nTranscript: ${video.transcript}\n\n`
          ).join('---\n');
          
          const currentPrompt = `Based on the following YouTube video transcripts, generate a clear and structured summary that directly answers the user's request: "${userQuery}"

IMPORTANT LANGUAGE INSTRUCTION: ${languageConfig.instruction}

Instructions for generating the summary:
1. Start by answering the user's query as directly as possible.
2. Use only information from the transcripts. Do not invent or assume anything not found in the transcripts.
3. Identify and include the most important points from each transcript that relate to the user's query.
4. If multiple transcripts discuss similar ideas or themes, highlight those recurring points.
5. If applicable, provide practical conclusions, lessons, or recommendations based on the transcripts.
6. Do not refer to the videos themselves (e.g., titles, URLs, creators, or platforms). Focus only on the content.
7. Write in simple, natural tone that matches the language of the user's request.
8. Use formatting with bullet points, emojis, or markdown. Use plain text and paragraphs only.
9. Remember: Write the ENTIRE summary in ${languageConfig.languageName}.

Transcripts:
${currentAllTranscripts}`;

          try {
            const attemptResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'YouTube Searcher',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: "user",
                    content: currentPrompt
                  }
                ],
                max_tokens: 2000,
                temperature: 0.7
              })
            });

            if (!attemptResponse.ok) {
              const attemptErrorData = await attemptResponse.json();
              const attemptErrorMessage = attemptErrorData.error?.message || attemptResponse.statusText;
              
              // Проверяем, является ли ошибка связанной с превышением контекста
              if ((attemptErrorMessage.includes('maximum context length') || 
                   attemptErrorMessage.includes('context_length_exceeded') || 
                   attemptErrorMessage.includes('tokens. However, you requested about') ||
                   attemptErrorMessage.includes('Please reduce the length')) && 
                  attempt < maxAttempts) {
                
                console.log(`⚠️ [API] Context still too large on attempt ${attempt}. Finding next longest video...`);
                
                // Находим следующее самое длинное видео (исключая уже обработанные)
                let nextLongestVideo = null;
                let nextMaxLength = 0;
                let nextLongestIndex = -1;
                
                videosToProcess.forEach((video, index) => {
                  const transcriptLength = video.transcript ? video.transcript.length : 0;
                  if (transcriptLength > nextMaxLength && !video.isTranscriptSummarized) {
                    nextMaxLength = transcriptLength;
                    nextLongestVideo = video;
                    nextLongestIndex = index;
                  }
                });
                
                if (!nextLongestVideo) {
                  throw new Error(`No more videos to process - all have been summarized but context is still too large`);
                }
                
                console.log(`📝 [API] Next longest video: "${nextLongestVideo.title}" with ${nextMaxLength} characters`);
                
                // Создаем summary для следующего длинного видео
                const nextSummaryPrompt = `Create a very concise summary of this YouTube video transcript. Focus ONLY on the main points and key insights. Keep it under 200 words and be very brief.

IMPORTANT LANGUAGE INSTRUCTION: ${languageConfig.instruction}

Video: ${nextLongestVideo.title}
Author: ${nextLongestVideo.author}
Transcript: ${nextLongestVideo.transcript}`;

                const nextSummaryResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${openRouterApiKey}`,
                    'HTTP-Referer': 'http://localhost:3001',
                    'X-Title': 'YouTube Searcher',
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    model: model,
                    messages: [
                      {
                        role: "user",
                        content: nextSummaryPrompt
                      }
                    ],
                    max_tokens: 400,
                    temperature: 0.5
                  })
                });

                if (!nextSummaryResponse.ok) {
                  throw new Error(`Failed to create summary for next longest video`);
                }

                const nextSummaryCompletion = await nextSummaryResponse.json();
                const nextSummary = nextSummaryCompletion.choices[0].message.content;
                
                console.log(`✅ [API] Next summary created for "${nextLongestVideo.title}"`);
                console.log(`📄 [API] Next summary length: ${nextSummary.length} characters`);
                
                // Обновляем следующее видео
                const nextUpdatedVideos = [...videosToProcess];
                nextUpdatedVideos[nextLongestIndex] = {
                  ...nextLongestVideo,
                  transcript: nextSummary,
                  isTranscriptSummarized: true
                };
                
                console.log(`🔄 [API] Updated next video data for "${nextLongestVideo.title}"`);
                
                // Рекурсивно пробуем снова
                return await processLongContent(nextUpdatedVideos, attempt + 1, maxAttempts);
              } else {
                throw new Error(`OpenRouter API error on attempt ${attempt}: ${attemptErrorMessage}`);
              }
            }

            // Успешный ответ
            const attemptCompletion = await attemptResponse.json();
            return {
              completion: attemptCompletion,
              processedVideos: videosToProcess
            };
            
          } catch (error) {
            if (attempt >= maxAttempts) {
              throw new Error(`Maximum attempts (${maxAttempts}) reached. Last error: ${error.message}`);
            }
            throw error;
          }
        };

        // Запускаем рекурсивную обработку
        const processResult = await processLongContent(updatedVideosWithTranscripts);
        const retryCompletion = processResult.completion;
        const finalProcessedVideos = processResult.processedVideos;
        const retrySummary = retryCompletion.choices[0].message.content;
        
        const result = {
          summary: retrySummary,
          totalResults: videos.length,
          transcriptCount: videosWithTranscripts.length,
          hasLongContentProcessing: true,
          longContentMessage: "too long content, making summary for the most long video and trying again",
          processedLongestVideo: {
            title: longestVideo.title,
            author: longestVideo.author,
            videoId: longestVideo.videoId,
            originalTranscriptLength: maxLength,
            summaryLength: individualSummary.length
          },
          updatedVideos: finalProcessedVideos, // Отправляем финальные обновленные данные видео
          videosProcessed: finalProcessedVideos.map(v => ({
            title: v.title,
            author: v.author,
            videoId: v.videoId,
            isTranscriptSummarized: v.isTranscriptSummarized || false
          }))
        };
        
        console.log(`✅ [API] Summary created successfully after processing longest video`);
        console.log(`📊 [API] Sending ${result.updatedVideos.length} updated videos to frontend`);
        console.log(`📊 [API] Final videos summary:`, result.updatedVideos.map(v => ({
          title: v.title,
          videoId: v.videoId,
          transcriptLength: v.transcript ? v.transcript.length : 0,
          isTranscriptSummarized: v.isTranscriptSummarized
        })));
        console.log(`📊 [API] Results:`, result);
        
        return res.json(result);
      } else {
        console.log(`❌ [API] This is NOT a context length error. Error type: other`);
        throw new Error(`OpenRouter API error: ${errorMessage}`);
      }
    }

    const completion = await response.json();
    const summary = completion.choices[0].message.content;
    
    const result = {
      summary: summary,
      totalResults: videos.length,
      transcriptCount: videosWithTranscripts.length,
      videosProcessed: videosWithTranscripts.map(v => ({
        title: v.title,
        author: v.author,
        videoId: v.videoId
      }))
    };
    
    console.log(`✅ [API] Summary created successfully`);
    console.log(`📊 [API] Results:`, result);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ [API] Error creating summary:', error.message);
    res.status(500).json({ 
      error: 'Failed to create summary',
      details: error.message 
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] YouTube search server running on http://localhost:${PORT}`);
  console.log(`📡 [SERVER] Available endpoints:`);
  console.log(`   GET  /api/search?q=<query>&limit=<number>`);
  console.log(`   POST /api/batch-search (with phrases array in body)`);
  console.log(`   POST /api/transcript (single video transcript)`);
  console.log(`   POST /api/transcripts (batch transcripts)`);
  console.log(`   POST /api/summarize-transcripts (summarize transcripts)`);
  console.log(`   POST /api/summarize-videos (summarize videos directly)`);
  if (SUPADATA_API_KEY === "YOUR_API_KEY_HERE") {
    console.log(`⚠️  [SUPADATA] Не забудьте установить API ключ в переменной SUPADATA_API_KEY!`);
  } else {
    console.log(`🔑 [SUPADATA] API Key: ${SUPADATA_API_KEY.substring(0, 10)}...`);
  }
});