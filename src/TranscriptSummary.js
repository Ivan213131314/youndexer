import React, { useState } from 'react';
import './TranscriptSummary.css';

const TranscriptSummary = ({ jobId, userQuery, onSummaryComplete }) => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSummary = async () => {
    if (!jobId || !userQuery) {
      setError('Необходимы jobId и userQuery для создания резюме');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      console.log('🚀 [SUMMARY] Создаем резюме...');
      console.log(`📋 [SUMMARY] JobId: ${jobId}`);
      console.log(`🔍 [SUMMARY] Запрос: "${userQuery}"`);

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
      console.log('📊 [SUMMARY] Результаты:', result);
      
      setSummary(result);
      
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
          <span>Создаем резюме на основе transcript...</span>
        </div>
      )}

      {summary && (
        <div className="summary-results">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Всего результатов:</span>
              <span className="stat-value">{summary.totalResults}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transcript найдено:</span>
              <span className="stat-value">{summary.transcriptCount}</span>
            </div>
          </div>

          <div className="summary-content">
            <h4>📋 Резюме</h4>
            <div className="summary-text">
              {summary.summary.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </div>
          </div>

          <div className="summary-meta">
            <div className="meta-item">
              <span className="meta-label">Job ID:</span>
              <span className="meta-value">{summary.jobId}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Запрос:</span>
              <span className="meta-value">{summary.userQuery}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptSummary; 