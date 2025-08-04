// Загружаем переменные окружени

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
const searchVideoCount = 6;  // кол-во видео возвращаемых сервером

// Supadata API конфигурация
const SUPADATA_API_KEY = "sd_cf39c3a6069af680097faf6f996b8c16"; // Замените на ваш API ключ
const SUPADATA_BASE_URL = "https://api.supadata.ai/v1";

// Динамический импорт Supadata функций
let createTranscriptBatch, checkBatchStatus;
(async () => {
    const supadataModule = await import('./supadata-client.js');
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
        const maxAttempts = 60; // максимум 60 попыток (60 секунд)
        const retryDelay = 2000; // 2 секунды между попытками
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 3; // максимум 3 ошибки подряд
        
        while (attempts < maxAttempts) {
            attempts++;
            console.log(`⏳ [SUPADATA] Проверяем статус batch job (попытка ${attempts}/${maxAttempts})`);
            
            try {
                const batchResult = await checkBatchStatus(jobId);
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
                        
                        return res.json({ transcripts: results });
                        
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
        res.status(500).json({ error: error.message });
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 [SERVER] YouTube search server running on http://localhost:${PORT}`);
  console.log(`📡 [SERVER] Available endpoints:`);
  console.log(`   GET  /api/search?q=<query>&limit=<number>`);
  console.log(`   POST /api/batch-search (with phrases array in body)`);
  console.log(`   POST /api/transcript (single video transcript)`);
  console.log(`   POST /api/transcripts (batch transcripts)`);
  console.log(`   POST /api/summarize-transcripts (summarize transcripts)`);
  if (SUPADATA_API_KEY === "YOUR_API_KEY_HERE") {
    console.log(`⚠️  [SUPADATA] Не забудьте установить API ключ в переменной SUPADATA_API_KEY!`);
  } else {
    console.log(`🔑 [SUPADATA] API Key: ${SUPADATA_API_KEY.substring(0, 10)}...`);
  }
});