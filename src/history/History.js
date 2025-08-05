import React, { useState } from 'react';
import { useSearchHistory, useHistoryItem } from './historyHooks';
import { formatHistoryDate, truncateQuery, hasSummary, hasSearchResults, getHistoryStats } from './historyUtils';
import TranscriptSummary from '../TranscriptSummary';
import './History.css';

const History = ({ onBackToMain }) => {
  const { history, loading, error, refreshHistory } = useSearchHistory();
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);
  const { historyItem, loading: itemLoading } = useHistoryItem(selectedHistoryId);
  const [isResizing, setIsResizing] = useState(false);
  const [leftColumnWidth, setLeftColumnWidth] = useState(50);

  const handleHistoryItemClick = (historyId) => {
    setSelectedHistoryId(historyId);
  };

  const handleBackClick = () => {
    setSelectedHistoryId(null);
  };

  const handleMouseDown = (e) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = (x / width) * 100;
    
    const clampedPercentage = Math.max(30, Math.min(70, percentage));
    setLeftColumnWidth(clampedPercentage);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleSummaryComplete = (summaryResult) => {
    console.log('🎉 [HISTORY] Summary completed:', summaryResult);
    // Обновляем историю после создания нового summary
    refreshHistory();
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="back-button" onClick={onBackToMain}>
            ← Назад к поиску
          </button>
          <h1>История поиска</h1>
        </div>
        <div className="loading-message">Загрузка истории...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="history-header">
          <button className="back-button" onClick={onBackToMain}>
            ← Назад к поиску
          </button>
          <h1>История поиска</h1>
        </div>
        <div className="error-message">Ошибка загрузки истории: {error}</div>
      </div>
    );
  }

  return (
    <div className="history-container">
      {/* Верхнее меню */}
      <div className="top-menu">
        <button className="menu-button active">History</button>
        <button className="menu-button">Channel parsing</button>
        <button className="menu-button">About us</button>
      </div>

      <div className="history-header">
        <button className="back-button" onClick={onBackToMain}>
          ← Назад к поиску
        </button>
        <h1>История поиска</h1>
      </div>

      {selectedHistoryId ? (
        // Детальный вид выбранной записи
        <div 
          className="main-content"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Левая колонка - Общий вывод */}
          <div 
            className="left-column"
            style={{ width: `${leftColumnWidth}%` }}
          >
            <div className="summary-section">
              <div className="history-item-header">
                <h2>📋 Общий вывод</h2>
                <button className="close-button" onClick={handleBackClick}>
                  ✕
                </button>
              </div>
              
              {itemLoading ? (
                <div className="loading-message">Загрузка данных...</div>
              ) : historyItem ? (
                <>
                  {/* Показываем компонент для создания резюме если его нет */}
                  {hasSearchResults(historyItem) && !hasSummary(historyItem) && (
                    <TranscriptSummary 
                      videos={historyItem.searchResults}
                      userQuery={historyItem.query}
                      onSummaryComplete={handleSummaryComplete}
                    />
                  )}

                  {/* Отображение готового резюме */}
                  {hasSummary(historyItem) && (
                    <div className="summary-display">
                      <div className="summary-stats">
                        <div className="stat-item">
                          <span className="stat-label">Всего результатов:</span>
                          <span className="stat-value">{historyItem.summaryData.totalResults}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Transcript найдено:</span>
                          <span className="stat-value">{historyItem.summaryData.transcriptCount}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Дата поиска:</span>
                          <span className="stat-value">{formatHistoryDate(historyItem.timestamp)}</span>
                        </div>
                      </div>

                      <div className="summary-content">
                        <h4>📋 Резюме по запросу: "{historyItem.query}"</h4>
                        <div className="summary-text">
                          {historyItem.summaryData.summary.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Если нет ни summary, ни результатов */}
                  {!hasSearchResults(historyItem) && !hasSummary(historyItem) && (
                    <div className="placeholder">
                      <p>Для этого запроса нет доступных данных</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="error-message">Запись не найдена</div>
              )}
            </div>
          </div>

          {/* Разделитель колонок */}
          <div 
            className="column-resizer"
            onMouseDown={handleMouseDown}
          ></div>

          {/* Правая колонка - Отдельные видео */}
          <div className="right-column">
            <div className="videos-section">
              <h2>📺 Найденные видео</h2>
              
              {itemLoading ? (
                <div className="loading-message">Загрузка видео...</div>
              ) : historyItem && hasSearchResults(historyItem) ? (
                <div className="videos-list">
                  {historyItem.searchResults.map((video, index) => (
                    <div key={index} className="video-item">
                      <h4>{video.title}</h4>
                      <p>Канал: {video.author}</p>
                      <p>Длительность: {video.duration}</p>
                      {video.transcript && (
                        <details>
                          <summary>► Показать transcript</summary>
                          <div className="transcript-content">
                            {typeof video.transcript === 'string' ? video.transcript : 'Transcript недоступен'}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder">
                  <p>Видео не найдены</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Список истории
        <div className="history-list">
          {history.length === 0 ? (
            <div className="empty-history">
              <p>История поиска пуста</p>
              <p>Выполните поиск, чтобы увидеть историю</p>
            </div>
          ) : (
            history.map((item) => {
              const stats = getHistoryStats(item);
              return (
                <div 
                  key={item.id} 
                  className="history-item"
                  onClick={() => handleHistoryItemClick(item.id)}
                >
                  <div className="history-item-content">
                    <div className="history-item-main">
                      <h3 className="history-query">{truncateQuery(item.query)}</h3>
                      <div className="history-meta">
                        <span className="history-date">{formatHistoryDate(item.timestamp)}</span>
                        {stats && (
                          <span className="history-stats">
                            {stats.totalResults} видео
                            {stats.hasSummary && ' • Есть резюме'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="history-item-actions">
                      <span className="checkmark">✓</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default History;