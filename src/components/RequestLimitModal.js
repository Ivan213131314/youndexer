import React from 'react';
import './RequestLimitModal.css';

function RequestLimitModal({ onClose, onUpgrade, remainingRequests, usedRequests }) {
  return (
    <div className="request-limit-overlay">
      <div className="request-limit-modal">
        <div className="request-limit-header">
          <h2>🚫 Лимит запросов исчерпан</h2>
          <button className="request-limit-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="request-limit-content">
          <div className="limit-info">
            <div className="limit-icon">📊</div>
            <p className="limit-text">
              Вы использовали все <strong>3 бесплатных запроса</strong> на сегодня.
            </p>
            <div className="limit-stats">
              <div className="stat-item">
                <span className="stat-label">Использовано сегодня:</span>
                <span className="stat-value used">{usedRequests}/3</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Осталось запросов:</span>
                <span className="stat-value remaining">{remainingRequests}</span>
              </div>
            </div>
          </div>

          <div className="upgrade-benefits">
            <h3>💎 Обновитесь до Pro для неограниченных запросов:</h3>
            <ul className="benefits-list">
              <li>✓ Неограниченные запросы</li>
              <li>✓ Pro модель (Gemini 2.0)</li>
              <li>✓ История поисков</li>
              <li>✓ Приоритетная поддержка</li>
            </ul>
          </div>

          <div className="request-limit-actions">
            <button className="upgrade-button" onClick={onUpgrade}>
              💎 Обновиться до Pro
            </button>
            <button className="close-button" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>

        <div className="request-limit-footer">
          <p className="reset-info">
            🔄 Лимит сбрасывается каждый день в 00:00
          </p>
        </div>
      </div>
    </div>
  );
}

export default RequestLimitModal;
