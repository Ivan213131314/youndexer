import React, { useState } from 'react';
import './TranscriptSummary.css';

const TranscriptSummary = ({ jobId, userQuery, onSummaryComplete }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSummary = async () => {
    if (!jobId || !userQuery) {
      setError('Необходимы jobId и userQuery для создания резюме');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 [SUMMARY] Создаем резюме...');
      console.log(`📋 [SUMMARY] JobId: ${jobId}`);
      console.log(`🔍 [SUMMARY] Запрос: "${userQuery}"`);

      const requestBody = {
        jobId,
        userQuery
      };

      console.log('📤 [SUMMARY] Отправляем запрос к серверу:');
      console.log('='.repeat(80));
      console.log('URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-transcripts`);
      console.log('Method: POST');
      console.log('Headers:', {
        'Content-Type': 'application/json'
      });
      console.log('Body:', JSON.stringify(requestBody, null, 2));
      console.log('='.repeat(80));

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/summarize-transcripts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          userQuery
        })
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

  return (
    <div className="transcript-summary">
      <div className="summary-header">
        <h3>📝 Создание резюме</h3>
        <button 
          className="summary-button"
          onClick={createSummary}
          disabled={isLoading || !jobId || !userQuery}
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