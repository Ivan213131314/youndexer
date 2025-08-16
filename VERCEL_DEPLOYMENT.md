# Развертывание на Vercel

## Преимущества Vercel:
- ✅ Бесплатно
- ✅ Простая настройка
- ✅ Автоматический деплой
- ✅ Serverless Functions
- ✅ CDN по всему миру

## Шаги развертывания:

### 1. Установка Vercel CLI
```bash
npm install -g vercel
```

### 2. Логин в Vercel
```bash
vercel login
```

### 3. Настройка переменных окружения
```bash
vercel env add OPENROUTER_API_KEY
vercel env add SUPADATA_API_KEY
```

### 4. Первый деплой
```bash
vercel
```

### 5. Продакшн деплой
```bash
vercel --prod
```

## Структура API роутов:

- `/api/search` - поиск видео
- `/api/batch-search` - пакетный поиск
- `/api/transcript` - получение транскрипций
- `/api/summarize-videos` - суммаризация

## Переменные окружения:

В Vercel Dashboard → Settings → Environment Variables:

- `OPENROUTER_API_KEY` - ваш ключ OpenRouter
- `SUPADATA_API_KEY` - ваш ключ Supadata

## Локальная разработка:

```bash
npm run dev
```

Это запустит и React приложение, и локальный сервер для разработки.

## Деплой:

```bash
npm run deploy
```

Это развернет приложение на Vercel в продакшене.
