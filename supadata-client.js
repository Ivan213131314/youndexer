import { Supadata } from '@supadata/js';

// Initialize the client
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16',
});

// Функция для создания batch job
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

// Функция для проверки статуса batch job
export async function checkBatchStatus(jobId) {
    try {
        console.log(`📊 [SUPADATA] Проверяем статус batch job: ${jobId}`);
        
        // Check the status of a batch job
        const batchResult = await supadata.youtube.batch.getJobStatus(jobId);
        
        console.log(`📊 [SUPADATA] Batch status: ${batchResult.status}`);
        return batchResult;
        
    } catch (error) {
        console.error('[SUPADATA] Ошибка проверки статуса:', error);
        throw error;
    }
} 