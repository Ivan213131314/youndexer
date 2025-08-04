import { Supadata } from '@supadata/js';
import OpenAI from 'openai';

// Initialize the client
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY // Убедитесь, что у вас есть OPENAI_API_KEY в переменных окружения
});

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
                    content: 'Ты - эксперт по анализу видео контента. Твоя задача - создать краткое и информативное резюме на основе предоставленных транскриптов видео.'
                },
                {
                    role: 'user',
                    content: `Создай резюме по следующим видео на основе запроса: "${userQuery}"\n\nТранскрипты видео:\n\n${combinedTranscripts}`
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
            totalResults: batchResults.results.length
        };
        
    } catch (error) {
        console.error('❌ Ошибка при создании резюме:', error.message);
        throw error;
    }
}

async function testBatchStatus() {
    const jobId = 'aadd0959-70f3-46e4-bd1b-caa45f72b293';
    
    console.log('🔍 [TEST] Проверяем доступные методы supadata.youtube.batch:');
    console.log(Object.getOwnPropertyNames(supadata.youtube.batch));
    console.log(Object.keys(supadata.youtube.batch));
    
    console.log('\n🔍 [TEST] Проверяем прототип:');
    console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(supadata.youtube.batch)));
    
    console.log('\n🔍 [TEST] Все методы объекта:');
    let obj = supadata.youtube.batch;
    while (obj) {
        console.log('Уровень:', Object.getOwnPropertyNames(obj));
        obj = Object.getPrototypeOf(obj);
        if (obj === Object.prototype) break;
    }
    
    // Пробуем разные варианты методов
    const methods = ['getJobStatus', 'status', 'get', 'getStatus', 'jobStatus'];
    
    for (const method of methods) {
        console.log(`\n🧪 [TEST] Пробуем метод: ${method}`);
        if (typeof supadata.youtube.batch[method] === 'function') {
            console.log(`✅ [TEST] Метод ${method} существует!`);
            try {
                const result = await supadata.youtube.batch[method](jobId);
                console.log(`✅ [TEST] Результат ${method}:`, result);
                break;
            } catch (error) {
                console.log(`❌ [TEST] Ошибка ${method}:`, error.message);
            }
        } else {
            console.log(`❌ [TEST] Метод ${method} не найден`);
        }
    }
    
    // Пробуем прямой HTTP запрос
    console.log('\n🌐 [TEST] Пробуем прямой HTTP запрос:');
    try {
        const response = await fetch(`https://api.supadata.ai/v1/youtube/batch/${jobId}`, {
            headers: {
                'x-api-key': 'sd_cf39c3a6069af680097faf6f996b8c16'
            }
        });
        
        console.log(`📡 [TEST] HTTP статус: ${response.status}`);
        const data = await response.json();
        console.log(`📄 [TEST] HTTP ответ:`, data);
        
    } catch (error) {
        console.log(`❌ [TEST] HTTP ошибка:`, error.message);
    }
}

// Пример использования функции для создания резюме
async function testTranscriptSummary() {
    const jobId = 'aadd0959-70f3-46e4-bd1b-caa45f72b293';
    const userQuery = 'Какие основные темы обсуждаются в этих видео?';
    
    try {
        console.log('🚀 Тестируем создание резюме...');
        const result = await getTranscriptSummary(jobId, userQuery);
        
        console.log('\n📊 Результаты:');
        console.log(`- Всего результатов: ${result.totalResults}`);
        console.log(`- Transcript найдено: ${result.transcriptCount}`);
        console.log('\n📝 Резюме:');
        console.log(result.summary);
        
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
    }
}

// Раскомментируйте следующую строку для тестирования функции резюме
// testTranscriptSummary().catch(console.error);

testBatchStatus().catch(console.error);