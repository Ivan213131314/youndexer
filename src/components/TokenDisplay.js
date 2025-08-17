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
          <span>Loading tokens...</span>
        </div>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="token-display">
        <div className="token-error">
          <span>Error loading tokens</span>
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
              <span className="token-label">Unlimited tokens</span>
            </div>
          ) : (
            <div className="token-limited">
              <span className="token-count">{tokenData.tokens}</span>
              <span className="token-label">
                {tokenData.tokens === 1 ? 'token' : 'tokens'}
              </span>
            </div>
          )}
          
          {isFree && (
            <div className="token-subscription">
              <span className="subscription-badge free">Free</span>
              <span className="subscription-info">3 tokens per day</span>
            </div>
          )}
          
          {isPro && (
            <div className="token-subscription">
              <span className={`subscription-badge ${tokenData.subscription}`}>
                {tokenData.subscription === 'pro' ? 'Pro' : 'Premium'}
              </span>
              <span className="subscription-info">
                {tokenData.subscription === 'pro' ? '100' : '300'} tokens per month
              </span>
            </div>
          )}
          
          {isLifetime && (
            <div className="token-subscription">
              <span className="subscription-badge lifetime">Lifetime</span>
              <span className="subscription-info">Unlimited tokens</span>
            </div>
          )}
        </div>
      </div>

      {isFree && tokenData.tokens <= 1 && (
        <div className="token-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">Few tokens remaining</span>
          <button className="upgrade-button" onClick={onUpgradeClick}>
            Upgrade
          </button>
        </div>
      )}

      {isFree && tokenData.tokens === 0 && (
        <div className="token-error">
          <span className="error-icon">❌</span>
          <span className="error-text">Tokens exhausted</span>
          <button className="upgrade-button" onClick={onUpgradeClick}>
            Buy tokens
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenDisplay;
