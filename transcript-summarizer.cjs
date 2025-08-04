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
            .map(result => {
                // Проверяем структуру transcript объекта
                if (typeof result.transcript === 'string') {
                    return result.transcript;
                } else if (result.transcript && result.transcript.content) {
                    return result.transcript.content;
                } else if (result.transcript && result.transcript.text) {
                    return result.transcript.text;
                } else {
                    console.log('⚠️ Неизвестная структура transcript:', result.transcript);
                    return JSON.stringify(result.transcript);
                }
            });
        
        if (transcripts.length === 0) {
            throw new Error('Не найдено ни одного transcript в результатах. Возможно, Supadata API недоступен.');
        }
        
        console.log(`📝 Найдено ${transcripts.length} transcript(ов)`);
        
        // Логируем первые символы каждого transcript для отладки
        transcripts.forEach((transcript, index) => {
            console.log(`📄 Transcript ${index + 1} (первые 100 символов): ${transcript.substring(0, 100)}...`);
        });
        
        // Логируем полные транскрипты
        console.log('\n📄 [TRANSCRIPTS] ПОЛНЫЕ ТРАНСКРИПТЫ:');
        console.log('='.repeat(80));
        transcripts.forEach((transcript, index) => {
            console.log(`\n--- TRANSCRIPT ${index + 1} ---`);
            console.log(transcript);
            console.log(`--- КОНЕЦ TRANSCRIPT ${index + 1} ---\n`);
        });
        console.log('='.repeat(80));
        
        // Объединяем все transcript в один текст
        const combinedTranscripts = transcripts.join('\n\n---\n\n');
        
        console.log('🤖 Отправляем в OpenAI для создания резюме...');
        
        // Формируем запрос для ChatGPT
        const systemPrompt = 'Ты - эксперт по анализу видео контента. Создавай краткие и информативные резюме на основе транскриптов видео.';
        const userPrompt = `Запрос: ${userQuery}\n\nТранскрипты:\n${combinedTranscripts}`;
        
        console.log('📤 [OPENAI] System Prompt:');
        console.log('='.repeat(80));
        console.log(systemPrompt);
        console.log('='.repeat(80));
        console.log('\n📤 [OPENAI] User Prompt (ПОЛНЫЙ ЗАПРОС):');
        console.log('='.repeat(80));
        console.log(userPrompt);
        console.log('='.repeat(80));
        console.log(`\n📊 [OPENAI] Общая длина запроса: ${userPrompt.length} символов`);
        
        // Отправляем в OpenAI для создания резюме
        const requestConfig = {
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: userPrompt
                }
            ],
            max_tokens: 2000,
            temperature: 0.7
        };
        
        console.log('⚙️ [OPENAI] Параметры запроса:');
        console.log(`   - Model: ${requestConfig.model}`);
        console.log(`   - Max tokens: ${requestConfig.max_tokens}`);
        console.log(`   - Temperature: ${requestConfig.temperature}`);
        console.log(`   - Messages count: ${requestConfig.messages.length}`);
        
        const completion = await openai.chat.completions.create(requestConfig);
        
        const summary = completion.choices[0].message.content;
        console.log('✅ Резюме создано успешно!');
        console.log('📥 [OPENAI] Ответ от ChatGPT:');
        console.log(summary);
        console.log(`📊 [OPENAI] Длина ответа: ${summary.length} символов`);
        
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
            .map(result => {
                // Проверяем структуру transcript объекта
                if (typeof result.transcript === 'string') {
                    return result.transcript;
                } else if (result.transcript && result.transcript.content) {
                    return result.transcript.content;
                } else if (result.transcript && result.transcript.text) {
                    return result.transcript.text;
                } else {
                    console.log('⚠️ Неизвестная структура transcript:', result.transcript);
                    return JSON.stringify(result.transcript);
                }
            });
        
        console.log(`📝 Найдено ${transcripts.length} transcript(ов)`);
        
        return transcripts;
        
    } catch (error) {
        console.error('❌ Ошибка при получении transcript:', error.message);
        throw error;
    }
}

// Экспортируем функции для CommonJS
module.exports = { getTranscriptSummary, getTranscriptsOnly }; 