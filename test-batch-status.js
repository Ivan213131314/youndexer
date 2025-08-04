import { Supadata } from '@supadata/js';

// Initialize the client
const supadata = new Supadata({
    apiKey: 'sd_cf39c3a6069af680097faf6f996b8c16'
});

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

testBatchStatus().catch(console.error);