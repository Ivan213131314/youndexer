import React from 'react';
import './Navigation.css';
import UserProfile from '../auth/UserProfile';
import AuthButtons from '../auth/AuthButtons';
import LogoIcon from './LogoIcon';

const Navigation = ({ currentPage, onPageChange, selectedHistoryId, onResetHistory }) => {
  const handleLogoClick = () => {
    // Переходим на главную страницу только если мы не на главной странице
    if (currentPage !== 'main') {
      onPageChange('main');
    }
  };

  const handleHistoryClick = () => {
    if (currentPage === 'history' && selectedHistoryId) {
      // Если мы на странице истории И открыт детальный просмотр - возвращаемся к списку
      onResetHistory();
    } else {
      // Иначе переходим на страницу истории
      onPageChange('history');
    }
  };

  return (
    <div className="navigation">
      <div className="logo" onClick={handleLogoClick}>
        <LogoIcon size={28} color="#1a73e8" />
        <span className="logo-text">YT Searcher</span>
      </div>
      
      <div className="nav-right">
        <div className="nav-menu">
          <button 
            className={`nav-button ${currentPage === 'main' ? 'active' : ''}`}
            onClick={() => onPageChange('main')}
          >
            Main
          </button>
          
          <button 
            className={`nav-button ${currentPage === 'history' ? 'active' : ''}`}
            onClick={handleHistoryClick}
          >
            History
          </button>

          <button 
            className={`nav-button ${currentPage === 'about' ? 'active' : ''}`}
            onClick={() => onPageChange('about')}
          >
            About us
          </button>
        </div>
        
        <div className="auth-section">
          <UserProfile />
          <AuthButtons />
        </div>
      </div>
    </div>
  );
};

export default Navigation;
