# YouTube Semantic Searcher

Приложение для семантического поиска YouTube видео с возможностью создания резюме на основе transcript.

## 🚀 Быстрый старт

### 1. Настройка проекта

```bash
# Клонируйте репозиторий
git clone <repository-url>
cd youtube-searcher

# Запустите скрипт настройки
node setup.js

# Установите зависимости
npm install
```

### 2. Настройка API ключей

1. Получите OpenAI API ключ на https://platform.openai.com/
2. Отредактируйте файл `.env` и замените `your-openai-api-key-here` на ваш ключ

### 3. Запуск приложения

```bash
# Запустите сервер (в одном терминале)
node server.js

# Запустите React приложение (в другом терминале)
npm start
```

Откройте http://localhost:3000 в браузере.

## 📋 Функциональность

### 🔍 Поиск видео
- Семантический поиск по YouTube
- Генерация ключевых фраз с помощью GPT
- Фильтрация результатов с помощью AI

### 📝 Создание резюме
- Получение transcript видео через Supadata
- Создание резюме на основе всех transcript
- Красивый UI для отображения результатов

## 🛠️ Технологии

- **Frontend**: React, CSS3
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4o
- **Video Processing**: Supadata API
- **Search**: yt-search

## 📁 Структура проекта

```
youtube-searcher/
├── src/
│   ├── App.js              # Основной React компонент
│   ├── App.css             # Стили приложения
│   ├── TranscriptSummary.js # Компонент создания резюме
│   ├── TranscriptSummary.css # Стили компонента резюме
│   ├── ytSearchModule.js   # Модуль поиска YouTube
│   └── videoFilter.js      # Фильтрация видео
├── server.js               # Express сервер
├── transcript-summarizer.cjs # Логика создания резюме
├── test-summary.js         # Тестирование резюме
├── setup.js                # Скрипт настройки
└── .env                    # Переменные окружения
```

## 🔧 API Endpoints

- `GET /api/search?q=<query>&limit=<number>` - Поиск видео
- `POST /api/batch-search` - Пакетный поиск
- `POST /api/transcript` - Получение transcript одного видео
- `POST /api/transcripts` - Пакетное получение transcript
- `POST /api/summarize-transcripts` - Создание резюме

## 🧪 Тестирование

```bash
# Тест создания резюме
node test-summary.js

# Тест batch статуса
node test-batch-status.js
```

## 📖 Использование

1. **Поиск видео**: Введите запрос в поле поиска
2. **Просмотр результатов**: Изучите найденные видео и их transcript
3. **Создание резюме**: Нажмите кнопку "Создать резюме" для получения AI-резюме

## 🔑 Переменные окружения

Создайте файл `.env` со следующими переменными:

```bash
OPENAI_API_KEY=your-openai-api-key
REACT_APP_OPENAI_API_KEY=your-openai-api-key
SUPADATA_API_KEY=sd_cf39c3a6069af680097faf6f996b8c16
REACT_APP_API_URL=http://localhost:3001
```

## 🎨 Особенности UI

- Современный дизайн с градиентами
- Анимированные элементы интерфейса
- Адаптивная верстка для мобильных устройств
- Красивое отображение результатов поиска и резюме

## 🚀 Деплой на продакшен

### Настройка переменных окружения для продакшена:

1. **API URL**: Измените `REACT_APP_API_URL` на URL вашего сервера:
   ```bash
   REACT_APP_API_URL=https://your-domain.com
   ```

2. **CORS**: Убедитесь, что сервер настроен для работы с вашим доменом

3. **SSL**: Используйте HTTPS для продакшена

### Примеры настроек:

**Для локальной разработки:**
```bash
REACT_APP_API_URL=http://localhost:3001
```

**Для продакшена:**
```bash
REACT_APP_API_URL=https://api.yourdomain.com
```

## 🚨 Устранение неполадок

### Ошибка "OPENAI_API_KEY is missing"
1. Убедитесь, что файл `.env` создан
2. Проверьте, что API ключ правильно указан
3. Перезапустите сервер

### Ошибки CORS
1. Убедитесь, что сервер запущен на порту 3001
2. Проверьте настройки CORS в server.js

### Проблемы с поиском
1. Проверьте подключение к интернету
2. Убедитесь, что API ключи активны
3. Проверьте консоль браузера на ошибки

## 📝 Лицензия

MIT License

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📞 Поддержка

При возникновении проблем создайте Issue в репозитории.
