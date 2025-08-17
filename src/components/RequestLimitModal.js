import React from 'react';
import './RequestLimitModal.css';

function RequestLimitModal({ onClose, onUpgrade, remainingRequests, usedRequests }) {
  return (
    <div className="request-limit-overlay">
      <div className="request-limit-modal">
        <div className="request-limit-header">
          <h2>🚫 Request limit exceeded</h2>
          <button className="request-limit-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="request-limit-content">
          <div className="limit-info">
            <div className="limit-icon">📊</div>
            <p className="limit-text">
              You have used all <strong>3 free requests</strong> for today.
            </p>
            <div className="limit-stats">
              <div className="stat-item">
                <span className="stat-label">Used today:</span>
                <span className="stat-value used">{usedRequests}/3</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining requests:</span>
                <span className="stat-value remaining">{remainingRequests}</span>
              </div>
            </div>
          </div>

          <div className="upgrade-benefits">
            <h3>💎 Upgrade to Pro for unlimited requests:</h3>
            <ul className="benefits-list">
              <li>✓ Unlimited requests</li>
              <li>✓ Pro model (Gemini 2.0)</li>
              <li>✓ Search history</li>
              <li>✓ Priority support</li>
            </ul>
          </div>

          <div className="request-limit-actions">
            <button className="upgrade-button" onClick={onUpgrade}>
              💎 Upgrade to Pro
            </button>
            <button className="close-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="request-limit-footer">
          <p className="reset-info">
            🔄 Limit resets every day at 00:00
          </p>
        </div>
      </div>
    </div>
  );
}

export default RequestLimitModal;
