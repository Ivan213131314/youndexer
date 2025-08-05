import { Supadata } from '@supadata/js';

// Initialize the client
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

// Отладочная информация
console.log('🔍 [SUPADATA] Доступные методы:', Object.keys(supadata.youtube.batch || {}));

// Функция для получения transcript одного видео
export async function getVideoTranscript(videoId) {
    try {
        console.log(`🎬 [SUPADATA] Получаем transcript для видео: ${videoId}`);
        
        // Get transcript for a single video
        const transcriptResult = await supadata.youtube.transcript({
            url: `https://www.youtube.com/watch?v=${videoId}`,
            lang: 'en',
            text: true
        });
        
        console.log(`✅ [SUPADATA] Transcript получен для видео: ${videoId}`);
        return transcriptResult;
        
    } catch (error) {
        console.error(`❌ [SUPADATA] Ошибка получения transcript для видео ${videoId}:`, error);
        return null;
    }
}

// Функция для получения transcriptов нескольких видео по отдельности
export async function getVideosTranscripts(videoIds) {
    console.log(`🚀 [SUPADATA] Получаем transcriptы для ${videoIds.length} видео по отдельности`);
    
    const results = [];
    
    for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        console.log(`📝 [SUPADATA] Обрабатываем видео ${i + 1}/${videoIds.length}: ${videoId}`);
        
        try {
            const transcript = await getVideoTranscript(videoId);
            results.push({
                videoId: videoId,
                transcript: transcript
            });
            
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
        }
    }
    
    console.log(`✅ [SUPADATA] Обработано ${results.length} видео`);
    return results;
}

// Функция для создания batch job (оставлена для обратной совместимости)
export async function createTranscriptBatch(videoIds) {
    try {
        console.log(`🚀 [SUPADATA] Создаем batch job для ${videoIds.length} видео через SDK`);
        
        // Start a YouTube transcript batch job
        const transcriptBatch = await supadata.youtube.transcript.batch({
            videoIds: videoIds,
            lang: 'en',
            text: true
        });
        
        console.log(`📋 [SUPADATA] Batch job создан: ${transcriptBatch.jobId}`);
        return transcriptBatch.jobId;
        
    } catch (error) {
        console.error('[SUPADATA] Ошибка создания batch job:', error);
        throw error;
    }
}

// Функция для проверки статуса batch job (оставлена для обратной совместимости)
export async function checkBatchStatus(jobId) {
    try {
        console.log(`📊 [SUPADATA] Проверяем статус batch job: ${jobId}`);
        
        // Check the status of a batch job
        const batchResult = await supadata.youtube.batch.getBatchResults(jobId);
        
        console.log(`📊 [SUPADATA] Batch status: ${batchResult.status}`);
        return batchResult;
        
    } catch (error) {
        console.error('[SUPADATA] Ошибка проверки статуса:', error);
        throw error;
    }
} 