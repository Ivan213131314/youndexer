import React, { useEffect, useRef } from 'react';
import { getHistoryItem } from '../history/historyService';

const DEFAULT_HISTORY_ID = "G2H4hGy7phlMFa9Cu2e4";

const DefaultQuery = ({ onLoadDefaultQuery }) => {
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Загружаем дефолтный запрос при монтировании компонента
    const loadDefaultQuery = async () => {
      // Предотвращаем повторные вызовы
      if (hasLoadedRef.current) {
        return;
      }

      try {
        console.log('🔄 [DEFAULT_QUERY] Loading default query from history ID:', DEFAULT_HISTORY_ID);
        
        // Получаем конкретную запись из истории
        const defaultQueryData = await getHistoryItem(DEFAULT_HISTORY_ID);
        
        if (defaultQueryData) {
          console.log('✅ [DEFAULT_QUERY] Found default query data:', defaultQueryData);
          
          // Вызываем callback для загрузки данных в основное приложение
          if (onLoadDefaultQuery) {
            onLoadDefaultQuery(defaultQueryData);
          }
        } else {
          console.log('ℹ️ [DEFAULT_QUERY] Default query not found or was deleted by user');
          // Если запрос не найден или удален - ничего не делаем (как требовал пользователь)
        }
      } catch (error) {
        console.error('❌ [DEFAULT_QUERY] Error loading default query:', error);
        // При ошибке также ничего не делаем
      } finally {
        // Отмечаем что загрузка завершена
        hasLoadedRef.current = true;
      }
    };

    loadDefaultQuery();
  }, [onLoadDefaultQuery]);

  // Компонент не рендерит ничего видимого
  return null;
};

export default DefaultQuery;
export { DEFAULT_HISTORY_ID };
