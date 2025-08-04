const { getTranscriptSummary } = require('./transcript-summarizer.cjs');

async function testSummary() {
  try {
    console.log('🧪 Тестируем создание резюме...');
    
    const jobId = 'aadd0959-70f3-46e4-bd1b-caa45f72b293';
    const userQuery = 'Какие основные темы обсуждаются в этих видео?';
    
    const result = await getTranscriptSummary(jobId, userQuery);
    
    console.log('\n📊 Результаты:');
    console.log(`- Всего результатов: ${result.totalResults}`);
    console.log(`- Transcript найдено: ${result.transcriptCount}`);
    console.log('\n📝 Резюме:');
    console.log(result.summary);
    
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  }
}

testSummary(); 