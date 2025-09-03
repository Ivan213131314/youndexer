# 🚀 Инструкции по деплою YouTube Searcher

## 📋 Подготовка к деплою

### 1. Создание файла .env.production

Скопируйте файл `production-config.example` в `.env.production` и настройте переменные:

```bash
cp production-config.example .env.production
```

Отредактируйте `.env.production`:

```env
# OpenAI API Key
OPENAI_API_KEY=sk-your-actual-openai-api-key

# React App OpenAI Key (для фронтенда)
REACT_APP_OPENAI_API_KEY=sk-your-actual-openai-api-key

# OpenRouter API Key
REACT_APP_OPEN_ROUTER_API_KEY=your-actual-openrouter-api-key

# API Server URL (замените на ваш домен)
REACT_APP_API_URL=https://your-domain.com

# Frontend URL (замените на ваш домен)
FRONTEND_URL=https://your-domain.com

# Node Environment
NODE_ENV=production

# Server Port (обычно устанавливается хостингом)
PORT=3001
```

### 2. Получение API ключей

- **OpenAI API Key**: https://platform.openai.com/api-keys
- **OpenRouter API Key**: https://openrouter.ai/keys

## 🌐 Деплой на разные хостинги

### Vercel (Рекомендуется для фронтенда)

1. **Подготовка проекта:**
   ```bash
   npm run build
   ```

2. **Создание vercel.json:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server.js"
       },
       {
         "src": "/(.*)",
         "dest": "/build/$1"
       }
     ]
   }
   ```

3. **Настройка переменных окружения в Vercel:**
   - Перейдите в Settings → Environment Variables
   - Добавьте все переменные из `.env.production`

4. **Деплой:**
   ```bash
   npm i -g vercel
   vercel --prod
   ```

### Railway

1. **Подключение к Railway:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

2. **Настройка переменных окружения:**
   - Перейдите в Variables в Railway Dashboard
   - Добавьте все переменные из `.env.production`

3. **Деплой:**
   ```bash
   railway up
   ```

### Heroku

1. **Создание Procfile:**
   ```
   web: node server.js
   ```

2. **Настройка переменных окружения:**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set REACT_APP_API_URL=https://your-app.herokuapp.com
   heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
   heroku config:set OPENAI_API_KEY=your-openai-key
   heroku config:set REACT_APP_OPENAI_API_KEY=your-openai-key
   heroku config:set REACT_APP_OPEN_ROUTER_API_KEY=your-openrouter-key
   ```

3. **Деплой:**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Создание app.yaml:**
   ```yaml
   name: youtube-searcher
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/youtube-searcher
       branch: main
     run_command: node server.js
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
   ```

2. **Настройка переменных окружения в DigitalOcean Dashboard**

## 🔧 Настройка домена

### 1. Настройка CORS

В `server.js` обновите CORS настройки для вашего домена:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || 'https://yourdomain.com',
        'https://yourdomain.com',
        'https://www.yourdomain.com'
      ] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
```

### 2. SSL сертификат

Убедитесь, что ваш хостинг поддерживает HTTPS. Большинство современных хостингов (Vercel, Railway, Heroku) предоставляют SSL автоматически.

## 🧪 Тестирование после деплоя

1. **Проверка API endpoints:**
   ```bash
   curl https://your-domain.com/api/search?q=test
   ```

2. **Проверка фронтенда:**
   - Откройте сайт в браузере
   - Попробуйте выполнить поиск
   - Проверьте создание резюме

3. **Проверка логов:**
   - Проверьте логи сервера на наличие ошибок
   - Убедитесь, что все API ключи работают

## 🚨 Частые проблемы

### 1. CORS ошибки
- Убедитесь, что `FRONTEND_URL` правильно настроен
- Проверьте, что домен добавлен в CORS настройки

### 2. API ключи не работают
- Проверьте, что все переменные окружения установлены
- Убедитесь, что ключи действительны и имеют достаточные лимиты

### 3. Сервер не запускается
- Проверьте, что `PORT` правильно настроен
- Убедитесь, что все зависимости установлены

### 4. Фронтенд не подключается к API
- Проверьте `REACT_APP_API_URL`
- Убедитесь, что API сервер доступен

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи сервера
2. Убедитесь, что все переменные окружения настроены
3. Проверьте, что домен правильно настроен в CORS

## 🔄 Обновление

Для обновления приложения:
1. Внесите изменения в код
2. Зафиксируйте изменения: `git add . && git commit -m "Update"`
3. Задеплойте: `vercel --prod` (или команда вашего хостинга)







