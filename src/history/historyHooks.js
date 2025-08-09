import { useState, useEffect } from 'react';
import { getSearchHistory, getHistoryItem, deleteHistoryItem, deleteAllHistory } from './historyService';
import { useAuth } from '../auth/AuthContext';

// Класс для кэширования элементов истории
class HistoryCache {
  constructor(maxSize = 50, ttl = 30 * 60 * 1000) { // 50 элементов, 30 минут TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  // Получить элемент из кэша
  get(id) {
    const cached = this.cache.get(id);
    if (!cached) return null;

    // Проверяем TTL
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(id);
      return null;
    }

    return cached.item;
  }

  // Сохранить элемент в кэш
  set(id, item) {
    // Очищаем старые записи если достигли лимита
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(id, {
      item,
      timestamp: Date.now()
    });
  }

  // Очистить устаревшие записи
  cleanup() {
    const now = Date.now();
    const toDelete = [];

    for (const [id, cached] of this.cache.entries()) {
      if (now - cached.timestamp > this.ttl) {
        toDelete.push(id);
      }
    }

    toDelete.forEach(id => this.cache.delete(id));

    // Если все еще много записей, удаляем самые старые
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 2));
      toRemove.forEach(([id]) => this.cache.delete(id));
    }
  }

  // Очистить весь кэш
  clear() {
    this.cache.clear();
  }

  // Получить размер кэша
  size() {
    return this.cache.size;
  }
}

// Глобальный экземпляр кэша
const historyCache = new HistoryCache();

// Периодическая очистка кэша каждые 10 минут
setInterval(() => {
  historyCache.cleanup();
}, 10 * 60 * 1000);

// Хук для получения списка истории
export const useSearchHistory = (limitCount = 20) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const userId = user?.uid || null;
        const historyData = await getSearchHistory(limitCount, userId);
        setHistory(historyData);
        setError(null);
      } catch (err) {
        console.error('❌ [HISTORY HOOK] Error fetching history:', err);
        // Не показываем ошибку пользователю, просто пустой список
        setHistory([]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [limitCount, user?.uid]);

  const refreshHistory = async () => {
    try {
      setLoading(true);
      const userId = user?.uid || null;
      const historyData = await getSearchHistory(limitCount, userId);
      setHistory(historyData);
      setError(null);
      
      // Очищаем кэш при обновлении истории, чтобы убрать устаревшие данные
      cleanupHistoryCache();
    } catch (err) {
      setError(err.message);
      console.error('❌ [HISTORY HOOK] Error refreshing history:', err);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, error, refreshHistory };
};

// Хук для удаления записи из истории
export const useDeleteHistoryItem = () => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const deleteItem = async (historyId) => {
    try {
      setDeleting(true);
      setError(null);
      
      const userId = user?.uid || null;
      
      // Удаляем из Firebase
      await deleteHistoryItem(historyId, userId);
      
      // Удаляем из кэша
      historyCache.cache.delete(historyId);
      console.log('🗑️ [HISTORY CACHE] Removed from cache:', historyId);
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('❌ [HISTORY HOOK] Error deleting history item:', err);
      return false;
    } finally {
      setDeleting(false);
    }
  };

  return { deleteItem, deleting, error };
};

// Хук для удаления всей истории
export const useDeleteAllHistory = () => {
  const [deletingAll, setDeletingAll] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const deleteAll = async () => {
    try {
      setDeletingAll(true);
      setError(null);
      
      const userId = user?.uid || null;
      
      // Удаляем из Firebase
      const deletedCount = await deleteAllHistory(userId);
      
      // Очищаем весь кэш
      historyCache.clear();
      console.log('🗑️ [HISTORY CACHE] All cache cleared');
      
      return deletedCount;
    } catch (err) {
      setError(err.message);
      console.error('❌ [HISTORY HOOK] Error deleting all history:', err);
      return 0;
    } finally {
      setDeletingAll(false);
    }
  };

  return { deleteAll, deletingAll, error };
};

// Хук для получения конкретной записи истории
export const useHistoryItem = (historyId) => {
  const [historyItem, setHistoryItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!historyId) {
      setHistoryItem(null);
      setLoading(false);
      return;
    }

    const fetchHistoryItem = async () => {
      try {
        setLoading(true);
        
        // Сначала проверяем кэш
        const cachedItem = historyCache.get(historyId);
        if (cachedItem) {
          console.log('⚡ [HISTORY CACHE] Hit for ID:', historyId);
          setHistoryItem(cachedItem);
          setError(null);
          setLoading(false);
          return;
        }

        // Если нет в кэше, загружаем с Firebase
        console.log('🌐 [HISTORY CACHE] Miss for ID:', historyId, '- loading from Firebase');
        const item = await getHistoryItem(historyId);
        
        if (item) {
          // Сохраняем в кэш
          historyCache.set(historyId, item);
          console.log('💾 [HISTORY CACHE] Saved to cache, cache size:', historyCache.size());
        }
        
        setHistoryItem(item);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('❌ [HISTORY HOOK] Error fetching history item:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryItem();
  }, [historyId]);

  return { historyItem, loading, error };
};

// Экспортируем функции для работы с кэшем
export const clearHistoryCache = () => {
  historyCache.clear();
  console.log('🧹 [HISTORY CACHE] Cache cleared');
};

export const getHistoryCacheSize = () => {
  return historyCache.size();
};

export const cleanupHistoryCache = () => {
  historyCache.cleanup();
  console.log('🧹 [HISTORY CACHE] Cache cleaned up, current size:', historyCache.size());
};