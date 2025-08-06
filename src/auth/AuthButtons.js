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

  // Не показываем кнопки, если пользователь уже авторизован
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
          Войти
        </button>
        <button 
          className="auth-btn signup-btn"
          onClick={() => openModal('signup')}
        >
          Регистрация
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