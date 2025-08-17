import React from 'react';
import './SearchProgress.css';

const SearchProgress = ({ currentStep, stepDetails, progressPercentage = 0 }) => {
  const getStepInfo = () => {
    switch (currentStep) {
      case 'searching':
        return { emoji: '🔍', label: 'Searching for relevant videos' };
      case 'filtering':
        return { emoji: '🤖', label: 'Filtering with GPT' };
      case 'transcribing':
        return { emoji: '📝', label: 'Getting transcripts' };
      case 'summarizing':
        return { emoji: '📋', label: 'Creating summary' };
      case 'ready':
        return { emoji: '✅', label: 'Ready!' };
      default:
        return { emoji: '⏳', label: 'Processing...' };
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
      
      {/* Progress bar for all steps */}
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
