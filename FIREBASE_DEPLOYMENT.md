# 🔥 Деплой на Firebase Hosting + Functions

## 📋 Подготовка

### 1. **Установка Firebase CLI**
```bash
npm install -g firebase-tools
```

### 2. **Вход в Firebase**
```bash
firebase login
```

### 3. **Инициализация проекта**
```bash
firebase init
```

Выберите:
- ✅ Hosting
- ✅ Functions
- Выберите проект: `careerbloom-fp61e`

## 🚀 Деплой

### 1. **Сборка проекта**
```bash
npm run build
```

### 2. **Деплой всего проекта**
```bash
npm run deploy
```

Или по частям:
```bash
# Только фронтенд
npm run deploy:hosting

# Только функции
npm run deploy:functions
```

## 🔧 Настройка переменных окружения

### 1. **Установка переменных в Firebase Functions**
```bash
firebase functions:config:set openai.key="your-openai-key"
firebase functions:config:set openrouter.key="your-openrouter-key"
firebase functions:config:set supadata.key="your-supadata-key"
```

### 2. **Или через Firebase Console**
1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `careerbloom-fp61e`
3. Functions → Settings → Environment variables
4. Добавьте переменные:
   - `OPENAI_API_KEY`
   - `REACT_APP_OPENAI_API_KEY`
   - `REACT_APP_OPEN_ROUTER_API_KEY`
   - `SUPADATA_API_KEY`

## 🌐 Настройка доменов

### 1. **Firebase Hosting**
- Автоматически доступен по адресу: `https://careerbloom-fp61e.web.app`
- Можно настроить кастомный домен в Firebase Console

### 2. **Firebase Functions**
- API будет доступен по адресу: `https://us-central1-careerbloom-fp61e.cloudfunctions.net/server`

### 3. **Обновление переменных окружения**
В Firebase Console обновите:
```env
REACT_APP_API_URL=https://us-central1-careerbloom-fp61e.cloudfunctions.net/server
FRONTEND_URL=https://careerbloom-fp61e.web.app
```

## 🧪 Тестирование

### 1. **Проверка API**
```bash
curl https://us-central1-careerbloom-fp61e.cloudfunctions.net/server/api/search?q=test
```

### 2. **Проверка фронтенда**
- Откройте: `https://careerbloom-fp61e.web.app`
- Попробуйте выполнить поиск
- Проверьте консоль браузера

### 3. **Проверка логов**
```bash
firebase functions:log
```

## 🚨 Частые проблемы

### 1. **Функции не деплоятся**
- Проверьте, что установлен firebase-functions
- Убедитесь, что в .firebaserc указан правильный проект

### 2. **API не работает**
- Проверьте логи функций: `firebase functions:log`
- Убедитесь, что переменные окружения установлены

### 3. **CORS ошибки**
- Проверьте настройки CORS в server.js
- Убедитесь, что домен добавлен в Firebase Console

### 4. **Фронтенд не подключается к API**
- Проверьте REACT_APP_API_URL
- Убедитесь, что функции деплоились успешно

## 📞 Поддержка

### 1. **Логи функций**
```bash
firebase functions:log --only server
```

### 2. **Локальное тестирование**
```bash
firebase emulators:start
```

### 3. **Проверка статуса**
```bash
firebase projects:list
firebase functions:list
```

## 🔄 Обновление

Для обновления приложения:
```bash
npm run build
firebase deploy
```

Или только функции:
```bash
firebase deploy --only functions
```
















