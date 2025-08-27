import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import './AuthButtons.css';

const AuthButtons = () => {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('login');

  const openModal = (mode) => {
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Don't show buttons if user is already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className="auth-buttons">
        <button 
          className="auth-btn login-btn"
          onClick={() => openModal('login')}
        >
          Sign In
        </button>
        <button 
          className="auth-btn signup-btn"
          onClick={() => openModal('signup')}
        >
          Register
        </button>
      </div>

      <AuthModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        mode={modalMode}
      />
    </>
  );
};

export default AuthButtons;