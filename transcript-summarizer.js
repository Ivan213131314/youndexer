import { Supadata } from '@supadata/js';
import OpenAI from 'openai';

// Initialize the clients
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Получает результаты batch job из Supadata, извлекает transcript поля
 * и создает резюме с помощью OpenAI
 * 
 * @param {string} jobId - ID batch job из Supadata
 * @param {string} userQuery - Запрос пользователя для создания резюме
 * @returns {Promise<Object>} Объект с резюме и метаданными
 */
async function getTranscriptSummary(jobId, userQuery) {
    try {
        console.log('🔍 Получаем результаты batch job...');
        
        // Получаем результаты batch job
        const batchResults = await supadata.youtube.batch.getBatchResults(jobId);
        
        if (batchResults.status !== 'completed') {
            throw new Error(`Batch job не завершен. Статус: ${batchResults.status}`);
        }
        
        console.log('✅ Batch job завершен, извлекаем transcript поля...');
        
        // Извлекаем transcript поля из каждого объекта
        const transcripts = batchResults.results
            .filter(result => result.transcript) // Фильтруем только объекты с transcript
            .map(result => result.transcript);
        
        if (transcripts.length === 0) {
            throw new Error('Не найдено ни одного transcript в результатах');
        }
        
        console.log(`📝 Найдено ${transcripts.length} transcript(ов)`);
        
        // Объединяем все transcript в один текст
        const combinedTranscripts = transcripts.join('\n\n---\n\n');
        
        console.log('🤖 Отправляем в OpenAI для создания резюме...');
        
        // Отправляем в OpenAI для создания резюме
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Ты - эксперт по анализу видео контента. Создавай краткие и информативные резюме на основе транскриптов видео.'
                },
                {
                    role: 'user',
                    content: `Запрос: ${userQuery}\n\nТранскрипты:\n${combinedTranscripts}`
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        });
        
        const summary = completion.choices[0].message.content;
        console.log('✅ Резюме создано успешно!');
        
        return {
            summary,
            transcriptCount: transcripts.length,
            totalResults: batchResults.results.length,
            jobId,
            userQuery
        };
        
    } catch (error) {
        console.error('❌ Ошибка при создании резюме:', error.message);
        throw error;
    }
}

/**
 * Получает только transcript поля из batch job без создания резюме
 * 
 * @param {string} jobId - ID batch job из Supadata
 * @returns {Promise<Array>} Массив transcript полей
 */
async function getTranscriptsOnly(jobId) {
    try {
        console.log('🔍 Получаем результаты batch job...');
        
        const batchResults = await supadata.youtube.batch.getBatchResults(jobId);
        
        if (batchResults.status !== 'completed') {
            throw new Error(`Batch job не завершен. Статус: ${batchResults.status}`);
        }
        
        // Извлекаем только transcript поля
        const transcripts = batchResults.results
            .filter(result => result.transcript)
            .map(result => result.transcript);
        
        console.log(`📝 Найдено ${transcripts.length} transcript(ов)`);
        
        return transcripts;
        
    } catch (error) {
        console.error('❌ Ошибка при получении transcript:', error.message);
        throw error;
    }
}

// Экспортируем функции для ES modules
export { getTranscriptSummary, getTranscriptsOnly };

// Экспортируем функции для CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getTranscriptSummary, getTranscriptsOnly };
}

// Пример использования (если файл запускается напрямую)
if (import.meta.url === `file://${process.argv[1]}`) {
    const jobId = process.argv[2] || 'aadd0959-70f3-46e4-bd1b-caa45f72b293';
    const userQuery = process.argv[3] || 'Какие основные темы обсуждаются в этих видео?';
    
    getTranscriptSummary(jobId, userQuery)
        .then(result => {
            console.log('\n📊 Результаты:');
            console.log(`- Всего результатов: ${result.totalResults}`);
            console.log(`- Transcript найдено: ${result.transcriptCount}`);
            console.log('\n📝 Резюме:');
            console.log(result.summary);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error.message);
            process.exit(1);
        });
} ш 