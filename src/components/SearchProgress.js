import React from 'react';
import './SearchProgress.css';

const SearchProgress = ({ currentStep, stepDetails, progressPercentage = 0 }) => {
  const getStepInfo = () => {
    switch (currentStep) {
      case 'searching':
        return { emoji: '🔍', label: 'Поиск релевантных видео' };
      case 'filtering':
        return { emoji: '🤖', label: 'Фильтрация с помощью GPT' };
      case 'transcribing':
        return { emoji: '📝', label: 'Получение транскрипций' };
      case 'summarizing':
        return { emoji: '📋', label: 'Создание резюме' };
      case 'ready':
        return { emoji: '✅', label: 'Готово!' };
      default:
        return { emoji: '⏳', label: 'Обработка...' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="search-progress">
      <div className="progress-content">
        <div className="loading-spinner"></div>
        <div className="step-info">
          <span className="step-emoji">{stepInfo.emoji}</span>
          <span className="step-label">{stepInfo.label}</span>
          {stepDetails && (
            <span className="step-details">{stepDetails}</span>
          )}
        </div>
      </div>
      
      {/* Прогресс-бар для всех шагов */}
      <div className="summary-progress-bar">
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="progress-percentage">{Math.round(progressPercentage)}%</div>
      </div>
    </div>
  );
};

export default SearchProgress;
