# Инструкции по настройке

## 1. Установка переменных окружения

Создайте файл `.env` в корневой папке проекта со следующим содержимым:

```bash
# OpenAI API Key
OPENAI_API_KEY=your-actual-openai-api-key-here

# Supadata API Key (уже настроен в коде)
SUPADATA_API_KEY=sd_cf39c3a6069af680097faf6f996b8c16

# React App OpenAI Key (для фронтенда)
REACT_APP_OPENAI_API_KEY=your-actual-openai-api-key-here

# API Server URL (для продакшена измените на ваш домен)
REACT_APP_API_URL=http://localhost:3001
```

## 2. Получение OpenAI API Key

1. Зайдите на https://platform.openai.com/
2. Войдите в свой аккаунт или создайте новый
3. Перейдите в раздел "API Keys"
4. Создайте новый API ключ
5. Скопируйте ключ и вставьте его в файл `.env`

## 3. Запуск проекта

### Запуск сервера:
```bash
node server.js
```

### Запуск React приложения:
```bash
npm start
```

## 4. Проверка работы

После настройки переменных окружения:

1. Запустите сервер: `node server.js`
2. Запустите React приложение: `npm start`
3. Откройте браузер и перейдите на http://localhost:3000
4. Выполните поиск видео
5. Нажмите кнопку "Создать резюме"

## 5. Тестирование API

Для тестирования функции создания резюме:

```bash
node test-summary.js
```

## Примечания

- Убедитесь, что у вас есть активный OpenAI API ключ с достаточным балансом
- Файл `.env` должен быть добавлен в `.gitignore` для безопасности
- Не коммитьте реальные API ключи в репозиторий 