import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUserTokens, subscribeToTokenChanges } from '../utils/tokenService';
import './TokenDisplay.css';

const TokenDisplay = ({ onUpgradeClick }) => {
  const { user } = useAuth();
  const [tokenData, setTokenData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTokenData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Подписываемся на изменения токенов в реальном времени
    const unsubscribe = subscribeToTokenChanges(user.uid, (data) => {
      setTokenData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="token-display">
        <div className="token-loading">
          <div className="token-spinner"></div>
          <span>Загрузка токенов...</span>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="token-display">
        <div className="token-error">
          <span>Ошибка загрузки токенов</span>
        </div>
      </div>
    );
  }

  const isLifetime = tokenData.subscription === 'lifetime';
  const isPro = tokenData.subscription === 'pro' || tokenData.subscription === 'premium';
  const isFree = tokenData.subscription === 'free';

  return (
    <div className="token-display">
      <div className="token-info">
        <div className="token-icon">🪙</div>
        <div className="token-details">
          {isLifetime ? (
            <div className="token-unlimited">
              <span className="token-count">∞</span>
              <span className="token-label">Неограниченные токены</span>
            </div>
          ) : (
            <div className="token-limited">
              <span className="token-count">{tokenData.tokens}</span>
              <span className="token-label">
                {tokenData.tokens === 1 ? 'токен' : 
                 tokenData.tokens >= 2 && tokenData.tokens <= 4 ? 'токена' : 'токенов'}
              </span>
            </div>
          )}
          
          {isFree && (
            <div className="token-subscription">
              <span className="subscription-badge free">Free</span>
              <span className="subscription-info">3 токена в день</span>
            </div>
          )}
          
          {isPro && (
            <div className="token-subscription">
              <span className={`subscription-badge ${tokenData.subscription}`}>
                {tokenData.subscription === 'pro' ? 'Pro' : 'Premium'}
              </span>
              <span className="subscription-info">
                {tokenData.subscription === 'pro' ? '100' : '300'} токенов в месяц
              </span>
            </div>
          )}
          
          {isLifetime && (
            <div className="token-subscription">
              <span className="subscription-badge lifetime">Lifetime</span>
              <span className="subscription-info">Неограниченные токены</span>
            </div>
          )}
        </div>
      </div>

      {isFree && tokenData.tokens <= 1 && (
        <div className="token-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Осталось мало токенов</span>
          <button className="upgrade-button" onClick={onUpgradeClick}>
            Улучшить
          </button>
        </div>
      )}

      {isFree && tokenData.tokens === 0 && (
        <div className="token-error">
          <span className="error-icon">❌</span>
          <span className="error-text">Токены закончились</span>
          <button className="upgrade-button" onClick={onUpgradeClick}>
            Купить токены
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenDisplay;
