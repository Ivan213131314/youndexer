import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { subscribeToTokenChanges } from '../utils/tokenService';
import SubscriptionModal from '../components/SubscriptionModal';
import './UserProfile.css';

const UserProfile = ({ onUpgradeClick }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Подписка на изменения токенов
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToTokenChanges(user.uid, (data) => {
      setTokenData(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Закрытие dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  if (!user) return null;

  return (
    <div className="user-profile" ref={dropdownRef}>
      <button className="user-profile-button" onClick={toggleDropdown}>
        <div className="user-avatar">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {user.email ? user.email[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>
        <span className="user-name">
          {user.displayName || user.email}
        </span>
        <svg 
          className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
          width="12" 
          height="12" 
          viewBox="0 0 12 12"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        </svg>
      </button>

      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" />
              ) : (
                <div className="dropdown-avatar-placeholder">
                  {user.email ? user.email[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className="dropdown-user-info">
              <div className="dropdown-user-name">
                {user.displayName || 'Пользователь'}
              </div>
              <div className="dropdown-user-email">
                {user.email}
              </div>
            </div>
          </div>
          
          <div className="dropdown-divider"></div>
          
          {/* Токены */}
          {tokenData && (
            <div className="dropdown-tokens">
              <div className="tokens-header">
                <div className="tokens-header-left">
                  <span className="tokens-icon">🪙</span>
                  <span className="tokens-label">Токены</span>
                </div>
                                 {(tokenData.subscription === 'pro' || tokenData.subscription === 'premium' || tokenData.subscription === 'lifetime') && (
                   <button 
                     className="tokens-settings-button"
                     onClick={() => {
                       setShowSubscriptionModal(true);
                       setIsDropdownOpen(false);
                     }}
                     title="Настройки подписки"
                   >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z" fill="currentColor"/>
                      <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159z" fill="currentColor"/>
                    </svg>
                  </button>
                )}
              </div>
              <div className="tokens-info">
                {tokenData.subscription === 'lifetime' ? (
                  <div className="tokens-unlimited">
                    <span className="tokens-count">∞</span>
                    <span className="tokens-subscription">Lifetime</span>
                  </div>
                ) : (
                  <div className="tokens-limited">
                    <span className="tokens-count">{tokenData.tokens}</span>
                    <span className="tokens-subscription">
                      {tokenData.subscription === 'free' ? 'Free' : 
                       tokenData.subscription === 'pro' ? 'Pro' : 'Premium'}
                    </span>
                  </div>
                )}
              </div>
              {(tokenData.subscription === 'free' && tokenData.tokens <= 1) && (
                <button className="upgrade-tokens-button" onClick={onUpgradeClick}>
                  Обновить
                </button>
              )}
            </div>
          )}
          
          <div className="dropdown-divider"></div>
          
          <button className="dropdown-item" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12V10H2V6H6V4L10 8L6 12Z" fill="currentColor"/>
              <path d="M12 2H8V4H12V12H8V14H12C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor"/>
            </svg>
            Выйти
          </button>
        </div>
      )}

      {/* Subscription Modal */}
      <SubscriptionModal 
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentSubscription={tokenData?.subscription || 'free'}
      />
    </div>
  );
};

export default UserProfile;