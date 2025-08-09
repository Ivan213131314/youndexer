import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, deleteDoc, writeBatch, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Сохранение результатов поиска в историю
export const saveSearchToHistory = async (searchData, userId = null) => {
  try {
    // Проверяем что db инициализирован
    if (!db) {
      console.error('❌ [HISTORY] Firebase db not initialized');
      return null;
    }

    // Проверяем входные данные
    if (!searchData || !searchData.query) {
      console.error('❌ [HISTORY] Invalid search data provided');
      return null;
    }

    // Для неавторизованных пользователей не сохраняем историю
    if (!userId) {
      console.log('ℹ️ [HISTORY] No userId provided, skipping save');
      return null;
    }

    // Ограничиваем размер данных для Firestore (1MB лимит)
    const historyData = {
      query: searchData.query,
      searchResults: searchData.searchResults ? searchData.searchResults.slice(0, 10) : [], // Ограничиваем до 10 видео
      summaryData: searchData.summaryData ? {
        summary: searchData.summaryData.summary,
        totalResults: searchData.summaryData.totalResults || 0,
        transcriptCount: searchData.summaryData.transcriptCount || 0
      } : null,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
      userId: userId // Добавляем userId
    };

    console.log('📝 [HISTORY] Attempting to save data:', {
      query: historyData.query,
      videosCount: historyData.searchResults.length,
      hasSummary: !!historyData.summaryData,
      userId: userId
    });

    const docRef = await addDoc(collection(db, 'searchHistory'), historyData);
    console.log('✅ [HISTORY] Search saved to history with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ [HISTORY] Error saving search to history:', error);
    console.error('🔍 [HISTORY] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    // Не бросаем ошибку, чтобы не ломать основной функционал
    return null;
  }
};

// Получение истории поиска
export const getSearchHistory = async (limitCount = 20, userId = null) => {
  try {
    // Для неавторизованных пользователей возвращаем пустую историю
    if (!userId) {
      console.log('ℹ️ [HISTORY] No userId provided, returning empty history');
      return [];
    }

    // Сначала получаем все записи пользователя без сортировки (чтобы избежать составного индекса)
    const q = query(
      collection(db, 'searchHistory'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Сортируем в JavaScript по createdAt
    history.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt) || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt) || new Date(0);
      return dateB - dateA; // По убыванию (новые сначала)
    });

    // Ограничиваем количество результатов
    const limitedHistory = history.slice(0, limitCount);

    console.log(`✅ [HISTORY] Retrieved ${limitedHistory.length} history items for user ${userId}`);
    return limitedHistory;
  } catch (error) {
    console.error('❌ [HISTORY] Error getting search history:', error);
    throw error;
  }
};

// Обновление существующей записи в истории
export const updateHistoryItem = async (historyId, updateData, userId = null) => {
  try {
    // Проверяем что db инициализирован
    if (!db) {
      console.error('❌ [HISTORY] Firebase db not initialized');
      return false;
    }

    // Для неавторизованных пользователей не обновляем историю
    if (!userId) {
      console.log('ℹ️ [HISTORY] No userId provided, skipping update');
      return false;
    }

    if (!historyId) {
      console.error('❌ [HISTORY] No historyId provided for update');
      return false;
    }

    // Подготавливаем данные для обновления
    const historyUpdateData = {
      ...updateData,
      updatedAt: new Date()
    };

    // Если есть summaryData, ограничиваем размер
    if (updateData.summaryData) {
      historyUpdateData.summaryData = {
        summary: updateData.summaryData.summary,
        totalResults: updateData.summaryData.totalResults || 0,
        transcriptCount: updateData.summaryData.transcriptCount || 0
      };
    }

    console.log('📝 [HISTORY] Attempting to update history item:', historyId, {
      hasSummary: !!historyUpdateData.summaryData,
      userId: userId
    });

    const docRef = doc(db, 'searchHistory', historyId);
    await updateDoc(docRef, historyUpdateData);
    
    console.log('✅ [HISTORY] History item updated successfully:', historyId);
    return true;
  } catch (error) {
    console.error('❌ [HISTORY] Error updating history item:', error);
    console.error('🔍 [HISTORY] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    return false;
  }
};

// Получение конкретной записи из истории
export const getHistoryItem = async (historyId) => {
  try {
    const docRef = doc(db, 'searchHistory', historyId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ [HISTORY] Retrieved history item:', historyId);
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      console.log('❌ [HISTORY] History item not found:', historyId);
      return null;
    }
  } catch (error) {
    console.error('❌ [HISTORY] Error getting history item:', error);
    throw error;
  }
};

// Сохранение дефолтного шаблона в отдельную коллекцию
export const saveDefaultTemplate = async (templateData) => {
  try {
    console.log('📝 [TEMPLATE] Saving default template...');
    
    // Удаляем поля, которые не нужны в шаблоне
    const { id, createdAt, timestamp, userId, isDefault, ...templateOnly } = templateData;
    
    const docRef = await addDoc(collection(db, 'defaultQueryTemplate'), {
      ...templateOnly,
      isTemplate: true,
      createdAt: new Date()
    });
    
    console.log('✅ [TEMPLATE] Default template saved with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ [TEMPLATE] Error saving default template:', error);
    throw error;
  }
};

// Получение дефолтного шаблона
export const getDefaultTemplate = async () => {
  try {
    console.log('🔍 [TEMPLATE] Getting default template...');
    
    const q = query(
      collection(db, 'defaultQueryTemplate'),
      where('isTemplate', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('❌ [TEMPLATE] No default template found');
      return null;
    }

    const template = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };

    console.log('✅ [TEMPLATE] Retrieved default template');
    return template;
  } catch (error) {
    console.error('❌ [TEMPLATE] Error getting default template:', error);
    throw error;
  }
};

// Создание персонального дефолтного запроса для пользователя
export const createUserDefaultQuery = async (userId) => {
  try {
    console.log('👤 [USER DEFAULT] Creating default query for user:', userId);
    
    // Получаем шаблон
    const template = await getDefaultTemplate();
    if (!template) {
      throw new Error('Default template not found');
    }
    
    // Создаем персональную копию
    const userDefaultQuery = {
      ...template,
      userId: userId,
      isDefault: true,
      createdAt: new Date(),
      timestamp: new Date().toISOString()
    };
    
    // Удаляем поля шаблона
    delete userDefaultQuery.isTemplate;
    delete userDefaultQuery.id;
    
    const docRef = await addDoc(collection(db, 'searchHistory'), userDefaultQuery);
    console.log('✅ [USER DEFAULT] Created default query for user with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...userDefaultQuery
    };
  } catch (error) {
    console.error('❌ [USER DEFAULT] Error creating user default query:', error);
    throw error;
  }
};

// Удаление записи из истории
export const deleteHistoryItem = async (historyId, userId = null) => {
  try {
    // Для безопасности проверяем, что запись принадлежит пользователю
    if (userId) {
      const historyItem = await getHistoryItem(historyId);
      if (!historyItem || historyItem.userId !== userId) {
        console.error('❌ [HISTORY] User not authorized to delete this item');
        throw new Error('Not authorized to delete this item');
      }
    }

    const docRef = doc(db, 'searchHistory', historyId);
    await deleteDoc(docRef);
    console.log('✅ [HISTORY] History item deleted:', historyId);
    return true;
  } catch (error) {
    console.error('❌ [HISTORY] Error deleting history item:', error);
    throw error;
  }
};

// Удаление всей истории пользователя (кроме дефолтной)
export const deleteAllHistory = async (userId = null) => {
  try {
    if (!userId) {
      console.log('ℹ️ [HISTORY] No userId provided, skipping delete');
      return 0;
    }

    // Получаем все записи пользователя
    const q = query(
      collection(db, 'searchHistory'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('✅ [HISTORY] No history items to delete');
      return 0;
    }

    const batch = writeBatch(db);
    let deletedCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Не удаляем дефолтные запросы
      if (!data.isDefault) {
        batch.delete(doc.ref);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }
    
    console.log(`✅ [HISTORY] Deleted ${deletedCount} history items for user ${userId}`);
    return deletedCount;
  } catch (error) {
    console.error('❌ [HISTORY] Error deleting all history:', error);
    throw error;
  }
};

// Инициализация дефолтного запроса в базе данных
export const initializeDefaultQuery = async () => {
  try {
    console.log('🔍 [HISTORY] Checking for default query...');
    
    // Проверяем, существует ли уже дефолтный запрос
    const q = query(
      collection(db, 'searchHistory'),
      where('isDefault', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('✅ [HISTORY] Default query already exists');
      return querySnapshot.docs[0].data();
    }

    // Создаем дефолтный запрос
    const defaultQueryData = {
      query: "Most Profitable Businesses to Start in 2025",
      searchResults: [
        {
          id: 1,
          videoId: "dQw4w9WgXcQ",
          title: "The 4 Most Profitable Businesses to Start in 2025",
          description: "Discover the most profitable business opportunities for 2025",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
          author: "Business Insights",
          publishedAt: "2024-01-01T00:00:00Z",
          duration: "PT10M30S",
          views: "1000000",
          transcript: "Welcome to our comprehensive guide on the most profitable businesses to start in 2025. In this video, we'll explore four key business opportunities that show tremendous potential for growth and profitability in the coming year. First, let's discuss the pet care industry which has seen explosive growth. High-end pet services such as luxury pet hotels, premium grooming services, and specialized pet products are showing incredible profit margins. The pet industry is recession-proof as people continue to spend on their beloved animals regardless of economic conditions."
        },
        {
          id: 2,
          videoId: "dQw4w9WgXcR",
          title: "8 High Income Businesses to Start in 2025",
          description: "High-income business ideas for 2025",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcR",
          thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcR/hqdefault.jpg",
          author: "Entrepreneur Today",
          publishedAt: "2024-01-15T00:00:00Z",
          duration: "PT15M45S",
          views: "850000",
          transcript: "Starting a business in 2025 requires careful consideration of market trends and consumer demands. Today we'll discuss eight high-income business opportunities that entrepreneurs should consider. The health and wellness sector continues to boom with med spas, telemedicine platforms, and wellness centers showing exceptional growth. Digital services like AI consulting, cybersecurity, and specialized digital marketing are in high demand as businesses adapt to new technologies."
        }
      ],
      summaryData: {
        summary: `**Summary of Most Profitable Businesses to Start in 2025**

### 1. Direct Response to User's Query

For those looking to start a business in 2025, the following are identified as the most profitable business opportunities across various video insights:

- **Pet Care Services**: High-end pet services such as luxury pet hotels and premium pet products.

- **Health and Wellness**: Med spas, telemedicine, and wellness centers targeting high-end clientele.

- **Sustainable and Eco-friendly Products**: Products that merge sustainability with luxury, such as eco-friendly packaging solutions and sustainable fashion.

- **Digital Services**: AI consulting, cybersecurity services, and digital marketing agencies focusing on emerging platforms.

- **Specialized Food Services**: Gourmet meal kits, specialty dietary products, and premium food delivery services.

### 2. Key Insights from Multiple Sources

The most profitable businesses share common characteristics: they solve specific problems, target underserved markets, have high profit margins, and can scale efficiently. Many successful 2025 business models focus on premium services rather than competing on price.

### 3. Actionable Recommendations

Start with thorough market research, ensure adequate funding, focus on customer experience, and consider businesses that can operate both online and offline. The most successful entrepreneurs in 2025 will be those who can adapt quickly to changing market conditions and leverage technology effectively.`,
        totalResults: 2,
        transcriptCount: 2
      },
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
      isDefault: true
    };

    const docRef = await addDoc(collection(db, 'searchHistory'), defaultQueryData);
    console.log('✅ [HISTORY] Default query created with ID:', docRef.id);
    
    return {
      id: docRef.id,
      ...defaultQueryData
    };
  } catch (error) {
    console.error('❌ [HISTORY] Error initializing default query:', error);
    throw error;
  }
};

// Получение дефолтного запроса пользователя
export const getDefaultQuery = async (userId = null) => {
  try {
    console.log('🔍 [HISTORY] Getting default query for user:', userId);
    
    // Для неавторизованных пользователей возвращаем шаблон
    if (!userId) {
      console.log('ℹ️ [HISTORY] No userId, returning template');
      return await getDefaultTemplate();
    }
    
    // Ищем дефолтный запрос пользователя
    const q = query(
      collection(db, 'searchHistory'),
      where('userId', '==', userId),
      where('isDefault', '==', true),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('ℹ️ [HISTORY] No default query found for user, creating...');
      return await createUserDefaultQuery(userId);
    }

    const defaultQuery = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };

    console.log('✅ [HISTORY] Retrieved default query for user');
    return defaultQuery;
  } catch (error) {
    console.error('❌ [HISTORY] Error getting default query:', error);
    throw error;
  }
};

// Функция для миграции существующего дефолтного запроса в шаблон
export const migrateDefaultQueryToTemplate = async (historyId = 'G2H4hGy7phlMFa9Cu2e4') => {
  try {
    console.log('🔄 [MIGRATION] Starting migration of default query to template...');
    
    // Проверяем, существует ли уже шаблон
    const existingTemplate = await getDefaultTemplate();
    if (existingTemplate) {
      console.log('✅ [MIGRATION] Template already exists, skipping migration');
      return existingTemplate;
    }
    
    // Получаем существующий дефолтный запрос
    const existingQuery = await getHistoryItem(historyId);
    if (!existingQuery) {
      console.log('⚠️ [MIGRATION] Default query not found, creating from fallback data');
      
      // Создаем дефолтный шаблон из резервных данных
      const fallbackTemplate = {
        query: "Most Profitable Businesses to Start in 2025",
        searchResults: [
          {
            id: 1,
            videoId: "dQw4w9WgXcQ",
            title: "The 4 Most Profitable Businesses to Start in 2025",
            description: "Discover the most profitable business opportunities for 2025",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
            author: "Business Insights",
            publishedAt: "2024-01-01T00:00:00Z",
            duration: "PT10M30S",
            views: "1000000",
            transcript: "Welcome to our comprehensive guide on the most profitable businesses to start in 2025..."
          },
          {
            id: 2,
            videoId: "dQw4w9WgXcR",
            title: "8 High Income Businesses to Start in 2025",
            description: "High-income business ideas for 2025",
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcR",
            thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcR/hqdefault.jpg",
            author: "Entrepreneur Today",
            publishedAt: "2024-01-15T00:00:00Z",
            duration: "PT15M45S",
            views: "850000",
            transcript: "Starting a business in 2025 requires careful consideration of market trends..."
          }
        ],
        summaryData: {
          summary: `**Summary of Most Profitable Businesses to Start in 2025**

### 1. Direct Response to User's Query

For those looking to start a business in 2025, the following are identified as the most profitable business opportunities:

- **Pet Care Services**: High-end pet services such as luxury pet hotels and premium pet products.
- **Health and Wellness**: Med spas, telemedicine, and wellness centers targeting high-end clientele.
- **Sustainable and Eco-friendly Products**: Products that merge sustainability with luxury.
- **Digital Services**: AI consulting, cybersecurity services, and digital marketing agencies.
- **Specialized Food Services**: Gourmet meal kits, specialty dietary products, and premium food delivery services.

### 2. Key Insights from Multiple Sources

The most profitable businesses share common characteristics: they solve specific problems, target underserved markets, have high profit margins, and can scale efficiently.

### 3. Actionable Recommendations

Start with thorough market research, ensure adequate funding, focus on customer experience, and consider businesses that can operate both online and offline.`,
          totalResults: 2,
          transcriptCount: 2
        }
      };
      
      const templateId = await saveDefaultTemplate(fallbackTemplate);
      console.log('✅ [MIGRATION] Created fallback template with ID:', templateId);
      return await getDefaultTemplate();
    }
    
    // Сохраняем как шаблон
    const templateId = await saveDefaultTemplate(existingQuery);
    console.log('✅ [MIGRATION] Successfully migrated default query to template');
    
    return await getDefaultTemplate();
  } catch (error) {
    console.error('❌ [MIGRATION] Error migrating default query to template:', error);
    throw error;
  }
};