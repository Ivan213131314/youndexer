console.log('🔍 Проверка конфигурации проекта...\n');

// Проверяем переменные окружения
const requiredEnvVars = [
  'OPENAI_API_KEY',
  'REACT_APP_OPENAI_API_KEY',
  'REACT_APP_API_URL'
];

console.log('📋 Проверка переменных окружения:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'your-openai-api-key-here') {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: не настроен`);
  }
});

console.log('\n🌐 Проверка API URL:');
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
console.log(`API URL: ${apiUrl}`);

if (apiUrl.includes('localhost')) {
  console.log('ℹ️  Используется локальная разработка');
} else {
  console.log('🚀 Настроен для продакшена');
}

console.log('\n📁 Проверка файлов:');
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  '.env',
  'server.js',
  'src/TranscriptSummary.js',
  'transcript-summarizer.cjs'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - отсутствует`);
  }
});

console.log('\n🎉 Проверка завершена!'); 