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

  // Subscribe to token changes
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

  // Determine whether to show the Upgrade to Pro button
  const shouldShowUpgradeButton = () => {
    if (!user) return false; // Don't show for unauthorized users
    if (!tokenData) return false; // Don't show until token data is loaded
    return tokenData.subscription === 'free'; // Show only for free subscription
  };

  const handleLogoClick = () => {
    // Go to main page only if we're not already on the main page
    if (currentPage !== 'main') {
      onPageChange('main');
    }
  };

  const handleHistoryClick = () => {
    if (currentPage === 'history' && selectedHistoryId) {
      // If we're on the history page AND detailed view is open - return to list
      onResetHistory();
    } else {
      // Otherwise go to history page
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
              <span className="paywall-button-text">💎 Upgrade to Pro</span>
              <span className="paywall-button-text-mobile">💎 Pro</span>
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
