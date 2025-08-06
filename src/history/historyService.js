import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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