import React from 'react';
import './TokenLimitModal.css';

const TokenLimitModal = ({ onClose, onUpgrade, currentTokens, subscriptionType }) => {
  const getSubscriptionName = (type) => {
    switch (type) {
      case 'free': return 'Free';
      case 'pro': return 'Pro';
      case 'premium': return 'Premium';
      case 'lifetime': return 'Lifetime';
      default: return 'Free';
    }
  };

  const getUpgradeMessage = (type) => {
    switch (type) {
      case 'free':
        return 'У вас закончились ежедневные токены. Обновите подписку для получения большего количества токенов.';
      case 'pro':
        return 'У вас закончились токены Pro подписки. Обновите до Premium для получения большего количества токенов.';
      case 'premium':
        return 'У вас закончились токены Premium подписки. Рассмотрите возможность покупки Lifetime подписки для неограниченных токенов.';
      default:
        return 'У вас закончились токены. Обновите подписку для продолжения использования.';
    }
  };

  return (
    <div className="token-limit-overlay">
      <div className="token-limit-modal">
        <div className="token-limit-header">
          <h2>🪙 Токены закончились</h2>
          <button className="token-limit-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="token-limit-content">
          <div className="token-status">
            <div className="token-icon">🪙</div>
            <div className="token-info">
              <span className="token-count">{currentTokens}</span>
              <span className="token-label">токенов осталось</span>
            </div>
          </div>

          <div className="subscription-status">
            <span className={`subscription-badge ${subscriptionType}`}>
              {getSubscriptionName(subscriptionType)}
            </span>
          </div>

          <p className="token-message">
            {getUpgradeMessage(subscriptionType)}
          </p>

                     <div className="token-benefits">
             <h3>Преимущества обновления:</h3>
             <ul>
               <li>🪙 <strong>Pro:</strong> 100 токенов в месяц</li>
               <li>🪙 <strong>Premium:</strong> 300 токенов в месяц</li>
               <li>🪙 <strong>Lifetime:</strong> Неограниченные токены</li>
               <li>📅 <strong>Free:</strong> 3 токена в день</li>
             </ul>
           </div>
        </div>

        <div className="token-limit-actions">
          <button className="upgrade-button" onClick={onUpgrade}>
            Обновить подписку
          </button>
          <button className="close-button" onClick={onClose}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default TokenLimitModal;
