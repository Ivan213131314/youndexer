# 🔥 Настройка Firebase Webhook для Gumroad

## 📋 Что было добавлено

### 1. **Firebase Admin SDK**
- Добавлен в `server.js` и `api/gumroad-webhook.js`
- Автоматически инициализируется при запуске

### 2. **Функции для работы с пользователями**
- `getUserByEmail(email)` - поиск пользователя по email
- `updateUserSubscription(userId, subscriptionType)` - обновление подписки

### 3. **Маппинг Gumroad tiers**
```javascript
const TIER_MAPPING = {
  'Membership Pro': 'pro',
  'Membership Premium': 'premium', 
  'Membership Lifetime': 'lifetime',
  'Pro': 'pro',
  'Premium': 'premium',
  'Lifetime': 'lifetime'
};
```

### 4. **Автоматическая обработка webhook**
- Извлекает email и tier из webhook данных
- Ищет пользователя в Firebase Auth по email
- Обновляет подписку в Firestore коллекции `userTokens`
- Пропускает возвраты и споры

## 🚀 Настройка для продакшена

### 1. **Firebase Service Account**
Для работы Firebase Admin SDK нужен service account key:

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `careerbloom-fp61e`
3. Project Settings → Service Accounts
4. Generate new private key
5. Скачайте JSON файл

### 2. **Переменные окружения**

#### Для Vercel:
```bash
# В Vercel Dashboard → Settings → Environment Variables
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
REACT_APP_FIREBASE_PROJECT_ID=careerbloom-fp61e
```

#### Для Firebase Functions:
```bash
# В Firebase Console → Functions → Configuration
firebase functions:config:set firebase.service_account="$(cat path/to/service-account.json)"
```

### 3. **Права доступа**
Service account должен иметь права:
- Firebase Authentication Admin
- Cloud Firestore User

## 🔍 Логирование

Webhook теперь логирует:
- ✅ Успешное обновление подписки
- ❌ Ошибки поиска пользователя
- ❌ Ошибки обновления подписки
- ⚠️ Неизвестные tiers
- ⚠️ Пропуск возвратов/споров

## 🧪 Тестирование

### 1. **Test webhook**
```bash
curl -X POST https://your-domain.com/api/gumroad/webhook \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&variants[Tier]=Membership Pro&test=true"
```

### 2. **Проверка логов**
```bash
curl https://your-domain.com/api/gumroad/webhook
```

## 📊 Структура данных

### Webhook данные:
```javascript
{
  email: "user@example.com",
  "variants[Tier]": "Membership Pro",
  refunded: "false",
  disputed: "false",
  test: "true"
}
```

### Обновление в Firestore:
```javascript
{
  subscription: "pro",
  subscriptionExpiresAt: "2024-02-14T07:08:08.000Z",
  tokens: 100, // добавляется к существующим
  totalTokensEarned: 100, // добавляется к существующим
  updatedAt: "2024-01-15T07:08:08.000Z"
}
```

## ⚠️ Важные моменты

1. **Пользователь должен существовать** в Firebase Auth
2. **Email должен совпадать** с зарегистрированным
3. **Tier должен быть в маппинге** иначе будет пропущен
4. **Возвраты и споры** автоматически пропускаются
5. **Токены добавляются** к существующим, не заменяют




