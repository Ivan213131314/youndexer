// Загружаем переменные окружения
require('dotenv').config();

const { Supadata } = require('@supadata/js');

// Initialize the clients
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

// Проверяем наличие OpenRouter API ключа
const openRouterApiKey = process.env.REACT_APP_OPEN_ROUTER_API_KEY;
if (!openRouterApiKey) {
    console.error('❌ Ошибка: Не установлен REACT_APP_OPEN_ROUTER_API_KEY в переменных окружения');
    console.error('📝 Создайте файл .env с вашим OpenRouter API ключом');
    process.exit(1);
}

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
        
        console.log('🤖 Отправляем в OpenRouter для создания резюме...');
        
        // Формируем запрос для LLM
        const systemPrompt = 'Ты - эксперт по анализу видео контента. Создавай краткие и информативные резюме на основе транскриптов видео.';
        const userPrompt = `Запрос: ${userQuery}\n\nТранскрипты:\n${combinedTranscripts}`;
        
        console.log('📤 [OPENROUTER] System Prompt:');
        console.log('='.repeat(80));
        console.log(systemPrompt);
        console.log('='.repeat(80));
        console.log('\n📤 [OPENROUTER] User Prompt (ПОЛНЫЙ ЗАПРОС):');
        console.log('='.repeat(80));
        console.log(userPrompt);
        console.log('='.repeat(80));
        console.log(`\n📊 [OPENROUTER] Общая длина запроса: ${userPrompt.length} символов`);
        
        // Отправляем в OpenRouter для создания резюме
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'HTTP-Referer': 'http://localhost:3001',
                'X-Title': 'YouTube Searcher',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o',
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
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const completion = await response.json();
        const summary = completion.choices[0].message.content;
        console.log('✅ Резюме создано успешно!');
        console.log('📥 [OPENROUTER] Ответ от LLM:');
        console.log(summary);
        console.log(`📊 [OPENROUTER] Длина ответа: ${summary.length} символов`);
        
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