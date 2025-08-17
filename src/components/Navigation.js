import React, { useState, useEffect } from 'react';
import './Navigation.css';
import UserProfile from '../auth/UserProfile';
import AuthButtons from '../auth/AuthButtons';
import LogoIcon from './LogoIcon';
import { useAuth } from '../auth/AuthContext';
import { subscribeToTokenChanges } from '../utils/tokenService';

const Navigation = ({ currentPage, onPageChange, selectedHistoryId, onResetHistory, onShowPaywall, isLoading }) => {
  const { user } = useAuth();
  const [tokenData, setTokenData] = useState(null);

  // Подписка на изменения токенов
  useEffect(() => {
    if (!user) {
      setTokenData(null);
      return;
    }

    const unsubscribe = subscribeToTokenChanges(user.uid, (data) => {
      setTokenData(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Определяем, нужно ли показывать кнопку Upgrade to Pro
  const shouldShowUpgradeButton = () => {
    if (!user) return false; // Не показываем для неавторизованных пользователей
    if (!tokenData) return false; // Не показываем пока не загрузились данные токенов
    return tokenData.subscription === 'free'; // Показываем только для бесплатной подписки
  };

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
          {shouldShowUpgradeButton() && (
            <button 
              className="paywall-button"
              onClick={onShowPaywall}
            >
              💎 Upgrade to Pro
            </button>
          )}
          
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
          <UserProfile onUpgradeClick={onShowPaywall} />
          <AuthButtons />
        </div>
      </div>
    </div>
  );
};

export default Navigation;
