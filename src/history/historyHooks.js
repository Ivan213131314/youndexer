import { useState, useEffect } from 'react';
import { getSearchHistory, getHistoryItem } from './historyService';

// Хук для получения списка истории
export const useSearchHistory = (limitCount = 20) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getSearchHistory(limitCount);
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
  }, [limitCount]);

  const refreshHistory = async () => {
    try {
      setLoading(true);
      const historyData = await getSearchHistory(limitCount);
      setHistory(historyData);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('❌ [HISTORY HOOK] Error refreshing history:', err);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, error, refreshHistory };
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
        const item = await getHistoryItem(historyId);
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