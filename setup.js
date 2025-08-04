const fs = require('fs');
const path = require('path');


console.log('🚀 Настройка проекта YouTube Searcher...\n');

// Проверяем наличие .env файла
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Создаем файл .env...');
    
    const envContent = `# OpenAI API Key
OPENAI_API_KEY=your-openai-api-key-here

# Supadata API Key (уже настроен в коде)

# React App OpenAI Key (для фронтенда)
REACT_APP_OPENAI_API_KEY=your-openai-api-key-here

# API Server URL (для продакшена измените на ваш домен)
REACT_APP_API_URL=http://localhost:3001
`;
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Файл .env создан');
    console.log('⚠️  Не забудьте заменить "your-openai-api-key-here" на ваш реальный OpenAI API ключ!\n');
} else {
    console.log('✅ Файл .env уже существует');
}

// Проверяем наличие .gitignore
const gitignorePath = path.join(__dirname, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
    console.log('📝 Создаем файл .gitignore...');
    
    const gitignoreContent = `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build

# misc
.DS_Store
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
    
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ Файл .gitignore создан');
} else {
    console.log('✅ Файл .gitignore уже существует');
}

console.log('\n📋 Следующие шаги:');
console.log('1. Установите зависимости: npm install');
console.log('2. Получите OpenAI API ключ на https://platform.openai.com/');
console.log('3. Замените "your-openai-api-key-here" в файле .env на ваш ключ');
console.log('4. Запустите сервер: node server.js');
console.log('5. Запустите React приложение: npm start');
console.log('\n🎉 Готово!'); 