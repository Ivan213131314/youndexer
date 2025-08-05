import React, { useState } from 'react';
import './TranscriptSummary.css';

const TranscriptSummary = ({ videos, userQuery, onSummaryComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSummary = async () => {
    if (!videos || videos.length === 0 || !userQuery) {
      setError('Необходимы видео и userQuery для создания резюме');
      return;
    }

    // Проверяем что есть видео с transcriptами
    const videosWithTranscripts = videos.filter(video => video.transcript);
    if (videosWithTranscripts.length === 0) {
      setError('Нет видео с transcriptами для создания резюме');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [SUMMARY] Создаем резюме...');
      console.log(`📋 [SUMMARY] Количество видео: ${videos.length}`);
      console.log(`📝 [SUMMARY] Видео с transcriptами: ${videosWithTranscripts.length}`);
      console.log(`🔍 [SUMMARY] Запрос: "${userQuery}"`);

      const requestBody = {
        videos: videosWithTranscripts,
        userQuery
      };

      console.log('📤 [SUMMARY] Отправляем запрос к серверу:');
      console.log('='.repeat(80));
      console.log('URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-videos`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json'
      });
      console.log('Body:', JSON.stringify({
        ...requestBody,
        videos: requestBody.videos.map(v => ({ ...v, transcript: v.transcript ? `${v.transcript.substring(0, 100)}...` : null }))
      }, null, 2));
      console.log('='.repeat(80));

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при создании резюме');
      }

      const result = await response.json();
      
      console.log('✅ [SUMMARY] Резюме создано успешно!');
      console.log('📥 [SUMMARY] Ответ от сервера:');
      console.log('='.repeat(80));
      console.log('Status:', response.status, response.statusText);
      console.log('Response:', JSON.stringify(result, null, 2));
      console.log('='.repeat(80));
      console.log('📊 [SUMMARY] Результаты:', result);
      
      if (onSummaryComplete) {
        onSummaryComplete(result);
      }

    } catch (error) {
      console.error('❌ [SUMMARY] Ошибка при создании резюме:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Проверяем есть ли видео с transcriptами
  const videosWithTranscripts = videos ? videos.filter(video => video.transcript) : [];
  const hasTranscripts = videosWithTranscripts.length > 0;

  return (
    <div className="transcript-summary">
      <div className="summary-header">
        <h3>📝 Создание резюме</h3>
        <div className="summary-stats">
          <span>Всего видео: {videos ? videos.length : 0}</span>
          <span>С transcriptами: {videosWithTranscripts.length}</span>
        </div>
        <button 
          className="summary-button"
          onClick={createSummary}
          disabled={isLoading || !hasTranscripts || !userQuery}
        >
          {isLoading ? 'Создаем резюме...' : 'Создать резюме'}
        </button>
      </div>

      {error && (
        <div className="summary-error">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {!hasTranscripts && videos && videos.length > 0 && (
        <div className="summary-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Нет видео с transcriptами для создания резюме</span>
        </div>
      )}

      {isLoading && (
        <div className="summary-loading">
          <div className="loading-spinner"></div>
          <span>Создаем резюме на основе всех транскриптов...</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptSummary; 