import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, deleteDoc, writeBatch, where } from 'firebase/firestore';
import { db } from '../firebase';

// Сохранение результатов поиска в историю
export const saveSearchToHistory = async (searchData) => {
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
      createdAt: new Date()
    };

    console.log('📝 [HISTORY] Attempting to save data:', {
      query: historyData.query,
      videosCount: historyData.searchResults.length,
      hasSummary: !!historyData.summaryData
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
export const getSearchHistory = async (limitCount = 20) => {
  try {
    const q = query(
      collection(db, 'searchHistory'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const history = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ [HISTORY] Retrieved ${history.length} history items`);
    return history;
  } catch (error) {
    console.error('❌ [HISTORY] Error getting search history:', error);
    throw error;
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

// Удаление записи из истории
export const deleteHistoryItem = async (historyId) => {
  try {
    const docRef = doc(db, 'searchHistory', historyId);
    await deleteDoc(docRef);
    console.log('✅ [HISTORY] History item deleted:', historyId);
    return true;
  } catch (error) {
    console.error('❌ [HISTORY] Error deleting history item:', error);
    throw error;
  }
};

// Удаление всей истории
export const deleteAllHistory = async () => {
  try {
    const q = query(collection(db, 'searchHistory'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('✅ [HISTORY] No history items to delete');
      return 0;
    }

    const batch = writeBatch(db);
    let deletedCount = 0;

    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
    });

    await batch.commit();
    console.log(`✅ [HISTORY] Deleted ${deletedCount} history items`);
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

// Получение дефолтного запроса
export const getDefaultQuery = async () => {
  try {
    console.log('🔍 [HISTORY] Getting default query...');
    
    const q = query(
      collection(db, 'searchHistory'),
      where('isDefault', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('ℹ️ [HISTORY] No default query found, initializing...');
      return await initializeDefaultQuery();
    }

    const defaultQuery = {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    };

    console.log('✅ [HISTORY] Retrieved default query');
    return defaultQuery;
  } catch (error) {
    console.error('❌ [HISTORY] Error getting default query:', error);
    throw error;
  }
};