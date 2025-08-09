import React, { useEffect, useRef } from 'react';
import { getDefaultQuery, migrateDefaultQueryToTemplate } from '../history/historyService';
import { useAuth } from '../auth/AuthContext';

const DEFAULT_HISTORY_ID = "G2H4hGy7phlMFa9Cu2e4";

const DefaultQuery = ({ onLoadDefaultQuery }) => {
  const hasLoadedRef = useRef(false);
  const { user } = useAuth();

  useEffect(() => {
    // Загружаем дефолтный запрос при монтировании компонента
    const loadDefaultQuery = async () => {
      // Предотвращаем повторные вызовы
      if (hasLoadedRef.current) {
        return;
      }

      try {
        console.log('🔄 [DEFAULT_QUERY] Loading default query for user:', user?.uid);
        
        // Сначала пытаемся мигрировать шаблон
        try {
          await migrateDefaultQueryToTemplate(DEFAULT_HISTORY_ID);
        } catch (migrationError) {
          console.log('⚠️ [DEFAULT_QUERY] Migration failed, will try fallback:', migrationError.message);
        }
        
        // Получаем персональный дефолтный запрос пользователя
        const defaultQueryData = await getDefaultQuery(user?.uid);
        
        if (defaultQueryData) {
          console.log('✅ [DEFAULT_QUERY] Found default query data:', defaultQueryData);
          
          // Вызываем callback для загрузки данных в основное приложение
          if (onLoadDefaultQuery) {
            onLoadDefaultQuery(defaultQueryData);
          }
        } else {
          console.log('ℹ️ [DEFAULT_QUERY] Default query not found, loading fallback');
          loadFallbackData();
        }
      } catch (error) {
        console.error('❌ [DEFAULT_QUERY] Error loading default query:', error);
        console.error('❌ [DEFAULT_QUERY] Error details:', error.message);
        loadFallbackData();
      } finally {
        // Отмечаем что загрузка завершена
        hasLoadedRef.current = true;
      }
    };

    // Функция для загрузки резервных данных
    const loadFallbackData = () => {
      try {
        const fallbackData = {
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

### Key Business Opportunities:

- **Pet Care Services**: High-end pet services and premium pet products
- **Health and Wellness**: Med spas, telemedicine, and wellness centers  
- **Digital Services**: AI consulting, cybersecurity, and digital marketing
- **Sustainable Products**: Eco-friendly and luxury sustainable goods
- **Specialized Food Services**: Gourmet meal kits and premium delivery

### Success Factors:

The most profitable businesses solve specific problems, target underserved markets, have high profit margins, and can scale efficiently.`,
            totalResults: 2,
            transcriptCount: 2
          }
        };
        
        if (onLoadDefaultQuery) {
          onLoadDefaultQuery(fallbackData);
        }
        console.log('✅ [DEFAULT_QUERY] Loaded fallback data');
      } catch (fallbackError) {
        console.error('❌ [DEFAULT_QUERY] Even fallback failed:', fallbackError);
      }
    };

    // Запускаем загрузку только если не в состоянии загрузки
    if (!hasLoadedRef.current) {
      loadDefaultQuery();
    }
  }, [onLoadDefaultQuery, user?.uid]); // Добавляем user?.uid в зависимости

  // Компонент не рендерит ничего видимого
  return null;
};

export default DefaultQuery;
export { DEFAULT_HISTORY_ID };
