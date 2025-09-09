# 🔥 Исправление проблемы с Firebase после деплоя

## 🚨 Проблема: auth/unauthorized-domain

Ошибка `auth/unauthorized-domain` означает, что Firebase не разрешает авторизацию с вашего домена.

## 🔧 Решение

### 1. **Добавление домена в Firebase Console**

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `careerbloom-fp61e`
3. Перейдите в **Authentication** → **Settings** → **Authorized domains**
4. Нажмите **Add domain**
5. Добавьте ваш домен:
   - Для Vercel: `your-app.vercel.app`
   - Для Railway: `your-app.railway.app`
   - Для Heroku: `your-app.herokuapp.com`
   - Для кастомного домена: `your-domain.com`

### 2. **Проверка переменных окружения**

Убедитесь, что на хостинге установлены все переменные:

```env
NODE_ENV=production
REACT_APP_API_URL=https://your-domain.com
FRONTEND_URL=https://your-domain.com
OPENAI_API_KEY=your-openai-key
REACT_APP_OPENAI_API_KEY=your-openai-key
REACT_APP_OPEN_ROUTER_API_KEY=your-openrouter-key
```

### 3. **Настройка Firebase для разных окружений**

Если нужно использовать разные Firebase проекты для разработки и продакшена:

1. Создайте отдельный Firebase проект для продакшена
2. Добавьте переменные окружения:

```env
REACT_APP_FIREBASE_API_KEY=your-production-firebase-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-production-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-production-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-production-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

### 4. **Проверка CORS настроек**

Убедитесь, что в `server.js` правильно настроен CORS:

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

## 🧪 Тестирование

### 1. **Проверка авторизации**
- Откройте сайт в браузере
- Попробуйте зарегистрироваться/войти
- Проверьте, что нет ошибки `auth/unauthorized-domain`

### 2. **Проверка консоли браузера**
- Откройте Developer Tools → Console
- Убедитесь, что нет ошибок Firebase
- Проверьте, что все API запросы проходят успешно

### 3. **Проверка логов сервера**
- Проверьте логи на хостинге
- Убедитесь, что сервер запускается без ошибок

## 🚨 Частые проблемы

### 1. **Домен не добавлен в Firebase**
- Убедитесь, что домен точно добавлен в Authorized domains
- Проверьте, что нет опечаток в домене

### 2. **Неправильные переменные окружения**
- Проверьте, что все переменные установлены на хостинге
- Убедитесь, что значения корректны

### 3. **Кэш браузера**
- Очистите кэш браузера
- Попробуйте в режиме инкогнито

### 4. **HTTPS vs HTTP**
- Убедитесь, что используется HTTPS в продакшене
- Firebase требует HTTPS для авторизации

## 📞 Если проблема остается

1. Проверьте логи Firebase в консоли
2. Убедитесь, что проект Firebase активен
3. Проверьте, что API ключи корректны
4. Попробуйте создать новый Firebase проект для тестирования

## 🔄 Обновление после исправления

После добавления домена в Firebase:
1. Подождите несколько минут (изменения могут применяться не сразу)
2. Очистите кэш браузера
3. Попробуйте авторизацию снова








