// Форматирование даты для отображения
export const formatHistoryDate = (timestamp) => {
  if (!timestamp) return 'Неизвестная дата';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'Только что';
  } else if (diffInHours < 24) {
    return `${diffInHours} ч. назад`;
  } else if (diffInHours < 48) {
    return 'Вчера';
  } else {
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
};

// Обрезка длинного запроса для отображения
export const truncateQuery = (query, maxLength = 50) => {
  if (!query) return '';
  if (query.length <= maxLength) return query;
  return query.substring(0, maxLength) + '...';
};

// Проверка наличия summary в записи истории
export const hasSummary = (historyItem) => {
  return historyItem && historyItem.summaryData && historyItem.summaryData.summary;
};

// Проверка наличия результатов поиска
export const hasSearchResults = (historyItem) => {
  return historyItem && historyItem.searchResults && historyItem.searchResults.length > 0;
};

// Получение статистики по записи истории
export const getHistoryStats = (historyItem) => {
  if (!historyItem) return null;
  
  const stats = {
    totalResults: 0,
    transcriptCount: 0,
    hasSummary: false
  };
  
  if (hasSearchResults(historyItem)) {
    stats.totalResults = historyItem.searchResults.length;
    stats.transcriptCount = historyItem.searchResults.filter(video => video.transcript).length;
  }
  
  if (hasSummary(historyItem)) {
    stats.hasSummary = true;
  }
  
  return stats;
};