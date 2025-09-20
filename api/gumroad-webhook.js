// api/gumroad-webhook.js

import admin from 'firebase-admin';

// Инициализация Firebase Admin SDK
if (!admin.apps.length) {
  try {
    let credential;
    
    // Проверяем, есть ли JSON credentials в переменных окружения
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      console.log('🔑 [FIREBASE] Using JSON credentials from environment variable');
      const serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
      credential = admin.credential.cert(serviceAccount);
    } else {
      console.log('🔑 [FIREBASE] Using application default credentials');
      credential = admin.credential.applicationDefault();
    }
    
    admin.initializeApp({
      credential: credential,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || 'careerbloom-fp61e'
    });
    console.log('✅ [FIREBASE] Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ [FIREBASE] Failed to initialize Admin SDK:', error.message);
  }
} else {
  console.log('✅ [FIREBASE] Admin SDK already initialized');
}

const db = admin.firestore();

// Маппинг Gumroad tiers в типы подписок
const TIER_MAPPING = {
  'Membership Pro': 'pro',
  'Membership Premium': 'premium', 
  'Membership Lifetime': 'lifetime',
  'Pro': 'pro',
  'Premium': 'premium',
  'Lifetime': 'lifetime'
};

// Функция для поиска пользователя по email
async function getUserByEmail(email) {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.uid;
  } catch (error) {
    console.error(`❌ [FIREBASE] Error finding user by email ${email}:`, error.message);
    return null;
  }
}

// Функция для обновления подписки пользователя
async function updateUserSubscription(userId, subscriptionType) {
  try {
    const tokenRef = db.collection('userTokens').doc(userId);
    const tokenDoc = await tokenRef.get();
    
    if (!tokenDoc.exists) {
      console.log(`❌ [FIREBASE] User ${userId} not found in userTokens collection`);
      return false;
    }
    
    const tokenData = tokenDoc.data();
    const now = new Date();
    let expiresAt = null;
    let tokensToAdd = 0;
    
    // Определяем параметры подписки
    switch (subscriptionType) {
      case 'pro':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        tokensToAdd = 100; // PRO_MONTHLY_TOKENS
        break;
      case 'premium':
        expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 дней
        tokensToAdd = 300; // PREMIUM_MONTHLY_TOKENS
        break;
      case 'lifetime':
        expiresAt = null; // Lifetime не истекает
        tokensToAdd = 0; // Lifetime не добавляет токены
        break;
      default:
        throw new Error(`Unknown subscription type: ${subscriptionType}`);
    }
    
    // Обновляем подписку
    await tokenRef.update({
      subscription: subscriptionType,
      subscriptionExpiresAt: expiresAt ? expiresAt.toISOString() : null,
      tokens: tokenData.tokens + tokensToAdd,
      totalTokensEarned: tokenData.totalTokensEarned + tokensToAdd,
      updatedAt: now.toISOString()
    });
    
    console.log(`✅ [FIREBASE] Updated subscription for user ${userId} to ${subscriptionType}`);
    return true;
  } catch (error) {
    console.error(`❌ [FIREBASE] Error updating subscription for user ${userId}:`, error.message);
    return false;
  }
}

// Простой лог-буфер для хранения последних событий
let logBuffer = [];
const MAX_LOGS = 50; // Максимум 50 последних событий

function addToLogBuffer(data) {
  const timestamp = new Date().toISOString();
  logBuffer.unshift({ timestamp, ...data });
  if (logBuffer.length > MAX_LOGS) {
    logBuffer = logBuffer.slice(0, MAX_LOGS);
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - возвращаем логи
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      logs: logBuffer,
      total: logBuffer.length
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const contentType = req.headers['content-type'] || '';
    let parsedBody = {};

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      parsedBody = Object.fromEntries(new URLSearchParams(raw));
    } else if (contentType.includes('application/json')) {
      parsedBody = req.body || {};
    } else {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      try {
        parsedBody = Object.fromEntries(new URLSearchParams(raw));
      } catch {
        parsedBody = { raw };
      }
    }

    console.log('📬 [GUMROAD] Webhook received', {
      method: req.method,
      contentType,
      query: req.query,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length'],
      },
      body: parsedBody,
    });

    // Дополнительный вывод в консоль для удобства
    console.log('🔍 [GUMROAD] Key fields:', {
      email: parsedBody.email,
      product_name: parsedBody.product_name,
      price: parsedBody.price,
      currency: parsedBody.currency,
      sale_id: parsedBody.sale_id,
      test: parsedBody.test,
      refunded: parsedBody.refunded,
      disputed: parsedBody.disputed,
      recurrence: parsedBody.recurrence,
      'variants[Tier]': parsedBody['variants[Tier]']
    });

    // Обрабатываем покупку подписки
    const { email, 'variants[Tier]': tier, refunded, disputed, test } = parsedBody;
    
    console.log(`🔍 [GUMROAD] Processing webhook data:`, {
      email,
      tier,
      refunded,
      disputed,
      test
    });
    
    // Проверяем, что это не возврат или спор
    if (refunded === 'true' || disputed === 'true') {
      console.log('⚠️ [GUMROAD] Skipping subscription update - refunded or disputed');
    } else if (email && tier) {
      console.log(`🔄 [GUMROAD] Processing subscription for email: ${email}, tier: ${tier}`);
      
      // Получаем тип подписки из маппинга
      const subscriptionType = TIER_MAPPING[tier];
      console.log(`🔍 [GUMROAD] Mapped tier "${tier}" to subscription type: ${subscriptionType}`);
      
      if (subscriptionType) {
        console.log(`🔍 [GUMROAD] Looking for user with email: ${email}`);
        // Ищем пользователя по email
        const userId = await getUserByEmail(email);
        console.log(`🔍 [GUMROAD] Found user ID: ${userId}`);
        
        if (userId) {
          console.log(`🔄 [GUMROAD] Updating subscription for user ${userId} to ${subscriptionType}`);
          // Обновляем подписку
          const success = await updateUserSubscription(userId, subscriptionType);
          
          if (success) {
            console.log(`✅ [GUMROAD] Successfully updated subscription for ${email} to ${subscriptionType}`);
          } else {
            console.log(`❌ [GUMROAD] Failed to update subscription for ${email}`);
          }
        } else {
          console.log(`❌ [GUMROAD] User not found for email: ${email}`);
        }
      } else {
        console.log(`⚠️ [GUMROAD] Unknown tier: ${tier}`);
        console.log(`🔍 [GUMROAD] Available tiers:`, Object.keys(TIER_MAPPING));
      }
    } else {
      console.log('⚠️ [GUMROAD] Missing email or tier in webhook data');
      console.log(`🔍 [GUMROAD] Email: ${email}, Tier: ${tier}`);
    }

    // Добавляем в лог-буфер для просмотра в браузере
    addToLogBuffer({
      type: 'webhook',
      email: parsedBody.email,
      product_name: parsedBody.product_name,
      price: parsedBody.price,
      currency: parsedBody.currency,
      sale_id: parsedBody.sale_id,
      test: parsedBody.test,
      refunded: parsedBody.refunded,
      disputed: parsedBody.disputed,
      recurrence: parsedBody.recurrence,
      'variants[Tier]': parsedBody['variants[Tier]'],
      ip_country: parsedBody.ip_country,
      order_number: parsedBody.order_number
    });

    // Возвращаем HTML с alert
    const logData = {
      type: 'webhook',
      email: parsedBody.email,
      product_name: parsedBody.product_name,
      price: parsedBody.price,
      currency: parsedBody.currency,
      sale_id: parsedBody.sale_id,
      test: parsedBody.test,
      refunded: parsedBody.refunded,
      disputed: parsedBody.disputed,
      recurrence: parsedBody.recurrence,
      'variants[Tier]': parsedBody['variants[Tier]'],
      ip_country: parsedBody.ip_country,
      order_number: parsedBody.order_number,
      timestamp: new Date().toISOString()
    };

    const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Gumroad Webhook</title></head>
    <body>
      <h1>Webhook received</h1>
      <p>Check alert and browser console for details</p>
      <script>
        alert('📬 GUMROAD WEBHOOK RECEIVED!\\n\\nEmail: ${parsedBody.email}\\nProduct: ${parsedBody.product_name}\\nPrice: $${parsedBody.price} ${parsedBody.currency}\\nSale ID: ${parsedBody.sale_id}\\nTest: ${parsedBody.test}');
        console.log('📬 [GUMROAD] Webhook received:', ${JSON.stringify(logData, null, 2)});
        console.table(${JSON.stringify([logData])});
      </script>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (error) {
    console.error('❌ [GUMROAD] Error handling webhook:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}