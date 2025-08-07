import React from 'react';
import './Navigation.css';
import UserProfile from '../auth/UserProfile';
import AuthButtons from '../auth/AuthButtons';
import LogoIcon from './LogoIcon';

const Navigation = ({ currentPage, onPageChange }) => {
  return (
    <div className="navigation">
      <div className="logo">
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
            onClick={() => onPageChange('history')}
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
