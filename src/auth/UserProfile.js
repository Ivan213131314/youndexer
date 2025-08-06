import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
          
          <button className="dropdown-item" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12V10H2V6H6V4L10 8L6 12Z" fill="currentColor"/>
              <path d="M12 2H8V4H12V12H8V14H12C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor"/>
            </svg>
            Выйти
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;