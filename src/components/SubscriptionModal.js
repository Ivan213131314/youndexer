import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { cancelSubscription, getUserTokens } from '../utils/tokenService';
import './SubscriptionModal.css';

const SubscriptionModal = ({ isOpen, onClose, currentSubscription }) => {
  const { user, setUserTokens } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'pro',
      name: 'Pro',
      price: 10,
      period: 'месяц',
      features: [
        'Pro модель',
        'История поисков',
        '100 токенов в месяц',
        '3 дня бесплатного пробного периода'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 18,
      period: 'месяц',
      features: [
        'Pro модель',
        'История поисков',
        '300 токенов в месяц',
        '3 дня бесплатного пробного периода'
      ],
      popular: true
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 98,
      originalPrice: 298,
      period: 'навсегда',
      features: [
        'Pro модель',
        'История поисков',
        'Неограниченные токены',
        'Пожизненный доступ',
        'Все будущие обновления'
      ],
      popular: false,
      discount: '67%'
    }
  ];

  const handleUpgrade = async (planId) => {
    setIsProcessing(true);
    try {
      console.log('Обновление подписки на план:', planId);
      // Здесь будет логика обновления подписки
      alert(`Подписка обновлена на план: ${planId}`);
      onClose();
    } catch (error) {
      console.error('Ошибка при обновлении подписки:', error);
      alert('Ошибка при обновлении подписки');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm('Вы уверены, что хотите отменить подписку? После отмены вы вернетесь к бесплатному плану.')) {
      setIsProcessing(true);
      try {
        console.log('Отмена подписки для пользователя:', user?.uid);
        
        // Отменяем подписку
        const success = await cancelSubscription(user.uid);
        
                 if (success) {
           console.log('Подписка успешно отменена');
           
           // Обновляем токены в контексте
           const updatedTokens = await getUserTokens(user.uid);
           if (updatedTokens) {
             setUserTokens(updatedTokens);
           }
           
           alert('Подписка отменена. Вы вернулись к бесплатному плану.');
           onClose();
        } else {
          console.error('Ошибка при отмене подписки');
          alert('Ошибка при отмене подписки. Попробуйте еще раз.');
        }
      } catch (error) {
        console.error('Ошибка при отмене подписки:', error);
        alert('Ошибка при отмене подписки');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay">
      <div className="subscription-modal">
        <div className="subscription-modal-header">
          <h2>Управление подпиской</h2>
          <button className="subscription-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="subscription-modal-content">
          {/* Текущая подписка */}
          <div className="current-subscription">
            <h3>Текущая подписка</h3>
            <div className="current-plan">
              <span className={`plan-badge ${currentSubscription}`}>
                {currentSubscription === 'free' ? 'Free' : 
                 currentSubscription === 'pro' ? 'Pro' : 
                 currentSubscription === 'premium' ? 'Premium' : 'Lifetime'}
              </span>
              <span className="plan-description">
                {currentSubscription === 'free' ? '3 токена в день' :
                 currentSubscription === 'pro' ? '100 токенов в месяц' :
                 currentSubscription === 'premium' ? '300 токенов в месяц' : 'Неограниченные токены'}
              </span>
            </div>
          </div>

          <div className="subscription-divider"></div>

          {/* Планы для обновления */}
          <div className="upgrade-section">
            <h3>Обновить подписку</h3>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`plan-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.popular && <div className="popular-badge">Популярный</div>}
                  {plan.discount && <div className="discount-badge">{plan.discount}</div>}
                  
                  <div className="plan-header">
                    <h4>{plan.name}</h4>
                    <div className="plan-price">
                      <span className="price">${plan.price}</span>
                      {plan.originalPrice && (
                        <span className="original-price">${plan.originalPrice}</span>
                      )}
                      <span className="period">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="plan-features">
                    {plan.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <button 
                    className="upgrade-plan-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpgrade(plan.id);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Обработка...' : 'Выбрать план'}
                  </button>
                </div>
              ))}
            </div>
          </div>

                     {/* Кнопка отмены подписки */}
           {(currentSubscription === 'pro' || currentSubscription === 'premium' || currentSubscription === 'lifetime') && (
             <>
               <div className="subscription-divider"></div>
               <div className="cancel-section">
                 <button 
                   className="cancel-subscription-button"
                   onClick={handleCancelSubscription}
                   disabled={isProcessing}
                 >
                   cancel subscription
                 </button>
               </div>
             </>
           )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
