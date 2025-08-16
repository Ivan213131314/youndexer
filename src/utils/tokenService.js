import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

// Константы для токенов
const DAILY_TOKENS = 3;
const PRO_MONTHLY_TOKENS = 100;
const PREMIUM_MONTHLY_TOKENS = 300;

// Получить или создать документ токенов для пользователя
const getOrCreateTokenDoc = async (userId) => {
  const tokenRef = doc(db, 'userTokens', userId);
  const tokenDoc = await getDoc(tokenRef);
  
  if (!tokenDoc.exists()) {
    // Создаем новый документ токенов
    const now = new Date();
    const tokenData = {
      userId,
      tokens: DAILY_TOKENS,
      lastDailyReset: now.toISOString(),
      subscription: 'free',
      subscriptionExpiresAt: null,
      totalTokensEarned: DAILY_TOKENS,
      totalTokensUsed: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };
    
    await setDoc(tokenRef, tokenData);
    return tokenData;
  }
  
  return tokenDoc.data();
};

// Проверить и обновить ежедневные токены
const checkAndUpdateDailyTokens = async (userId) => {
  const tokenData = await getOrCreateTokenDoc(userId);
  const now = new Date();
  const lastReset = new Date(tokenData.lastDailyReset);
  
  // Проверяем, прошло ли больше 24 часов с последнего сброса
  const hoursSinceReset = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursSinceReset >= 24) {
    // Обновляем токены и время сброса
    // Только Free пользователи получают ежедневные токены
    const newTokens = tokenData.subscription === 'free' ? 
      tokenData.tokens + DAILY_TOKENS : 
      tokenData.tokens;
    
    const tokensToAdd = tokenData.subscription === 'free' ? DAILY_TOKENS : 0;
    
    await updateDoc(doc(db, 'userTokens', userId), {
      tokens: newTokens,
      lastDailyReset: now.toISOString(),
      totalTokensEarned: tokenData.totalTokensEarned + tokensToAdd,
      updatedAt: now.toISOString()
    });
    
    return {
      ...tokenData,
      tokens: newTokens,
      lastDailyReset: now.toISOString(),
      totalTokensEarned: tokenData.totalTokensEarned + tokensToAdd
    };
  }
  
  return tokenData;
};

// Получить данные токенов пользователя
export const getUserTokens = async (userId) => {
  if (!userId) return null;
  
  try {
    return await checkAndUpdateDailyTokens(userId);
  } catch (error) {
    console.error('Ошибка при получении токенов пользователя:', error);
    return null;
  }
};

// Использовать токен
export const consumeToken = async (userId) => {
  if (!userId) return false;
  
  try {
    const tokenData = await checkAndUpdateDailyTokens(userId);
    
    // Lifetime пользователи не тратят токены
    if (tokenData.subscription === 'lifetime') {
      return true;
    }
    
    // Проверяем, есть ли токены
    if (tokenData.tokens <= 0) {
      return false;
    }
    
    // Уменьшаем количество токенов
    await updateDoc(doc(db, 'userTokens', userId), {
      tokens: increment(-1),
      totalTokensUsed: increment(1),
      updatedAt: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при использовании токена:', error);
    return false;
  }
};

// Проверить, можно ли использовать токен
export const canUseToken = async (userId) => {
  if (!userId) return false;
  
  try {
    const tokenData = await checkAndUpdateDailyTokens(userId);
    
    // Lifetime пользователи всегда могут использовать токены
    if (tokenData.subscription === 'lifetime') {
      return true;
    }
    
    return tokenData.tokens > 0;
  } catch (error) {
    console.error('Ошибка при проверке токенов:', error);
    return false;
  }
};

// Купить подписку
export const purchaseSubscription = async (userId, subscriptionType) => {
  if (!userId) return false;
  
  try {
    const now = new Date();
    let expiresAt = null;
    let tokensToAdd = 0;
    
    switch (subscriptionType) {
      case 'pro':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        tokensToAdd = PRO_MONTHLY_TOKENS;
        break;
      case 'premium':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        tokensToAdd = PREMIUM_MONTHLY_TOKENS;
        break;
      case 'lifetime':
        expiresAt = null; // Lifetime не истекает
        tokensToAdd = 0; // Lifetime не добавляет токены
        break;
      default:
        throw new Error('Неизвестный тип подписки');
    }
    
    const tokenData = await getOrCreateTokenDoc(userId);
    
    await updateDoc(doc(db, 'userTokens', userId), {
      subscription: subscriptionType,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      tokens: tokenData.tokens + tokensToAdd,
      totalTokensEarned: tokenData.totalTokensEarned + tokensToAdd,
      updatedAt: now.toISOString()
    });
    
    return true;
  } catch (error) {
    console.error('Ошибка при покупке подписки:', error);
    return false;
  }
};

// Подписаться на изменения токенов в реальном времени
export const subscribeToTokenChanges = (userId, callback) => {
  if (!userId) return () => {};
  
  const tokenRef = doc(db, 'userTokens', userId);
  return onSnapshot(tokenRef, async (doc) => {
    if (doc.exists()) {
      const tokenData = await checkAndUpdateDailyTokens(userId);
      callback(tokenData);
    } else {
      callback(null);
    }
  });
};

// Получить информацию о подписке
export const getSubscriptionInfo = (subscriptionType) => {
  switch (subscriptionType) {
    case 'pro':
      return {
        name: 'Pro',
        monthlyTokens: PRO_MONTHLY_TOKENS,
        price: 10,
        features: [
          'Pro модель',
          'История поисков',
          '100 токенов в месяц',
          '3 дня бесплатного пробного периода'
        ]
      };
    case 'premium':
      return {
        name: 'Premium',
        monthlyTokens: PREMIUM_MONTHLY_TOKENS,
        price: 18,
        features: [
          'Pro модель',
          'История поисков',
          '300 токенов в месяц',
          '3 дня бесплатного пробного периода'
        ]
      };
    case 'lifetime':
      return {
        name: 'Lifetime',
        monthlyTokens: 'unlimited',
        price: 98,
        features: [
          'Pro модель',
          'История поисков',
          'Неограниченные токены',
          'Пожизненный доступ',
          'Все будущие обновления'
        ]
      };
    default:
      return {
        name: 'Free',
        monthlyTokens: DAILY_TOKENS * 30, // 3 токена в день * 30 дней
        price: 0,
        features: [
          '3 токена в день',
          'Базовые функции'
        ]
      };
  }
};
