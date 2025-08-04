// Загружаем переменные окружения
require('dotenv').config();

const { Supadata } = require('@supadata/js');
const OpenAI = require('openai');

// Initialize the clients
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

// Проверяем наличие OpenAI API ключа
const openaiApiKey = process.env.OPENAI_API_KEY || process.env.REACT_APP_OPENAI_API_KEY;
if (!openaiApiKey || openaiApiKey === 'your-openai-api-key-here') {
    console.error('❌ Ошибка: Не установлен OPENAI_API_KEY или REACT_APP_OPENAI_API_KEY в переменных окружения');
    console.error('📝 Создайте файл .env с вашим OpenAI API ключом');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: openaiApiKey
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

// Экспортируем функции для CommonJS
module.exports = { getTranscriptSummary, getTranscriptsOnly }; 