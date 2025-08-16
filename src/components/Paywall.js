import React, { useState } from 'react';
import './Paywall.css';
import { purchaseSubscription } from '../utils/tokenService';
import { useAuth } from '../auth/AuthContext';

function Paywall({ onClose, onSubscribe }) {
  const { user, setUserTokens } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'pro',
      name: 'Pro',
      price: 10,
      originalPrice: null,
      period: 'месяц',
             features: [
         'Pro модель',
         'История поисков',
         '100 токенов в месяц',
         '3 дня бесплатного пробного периода'
       ],
      popular: false,
      discount: null
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 18,
      originalPrice: null,
      period: 'месяц',
             features: [
         'Pro модель',
         'История поисков',
         '300 токенов в месяц',
         '3 дня бесплатного пробного периода'
       ],
      popular: true,
      discount: null
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

  const handleSubscribe = async (planId) => {
    if (!user) {
      console.error('Пользователь не авторизован');
      return;
    }

    setIsProcessing(true);
    try {
      // Покупаем подписку
      const success = await purchaseSubscription(user.uid, planId);
      
      if (success) {
        console.log('Подписка успешно куплена:', planId);
        
        // Обновляем токены в контексте
        const { getUserTokens } = await import('../utils/tokenService');
        const updatedTokens = await getUserTokens(user.uid);
        setUserTokens(updatedTokens);
        
        if (onSubscribe) {
          await onSubscribe(planId);
        }
      } else {
        console.error('Ошибка при покупке подписки');
        alert('Ошибка при покупке подписки. Попробуйте еще раз.');
      }
    } catch (error) {
      console.error('Ошибка подписки:', error);
      alert('Ошибка при покупке подписки. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="paywall-overlay">
      <div className="paywall-modal">
        <div className="paywall-header">
          <h2>Выберите план подписки</h2>
          <p>Получите доступ к расширенным возможностям</p>
          <button className="paywall-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="paywall-plans">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className={`paywall-plan ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="popular-badge">Популярный</div>
              )}
              
              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">
                  {plan.originalPrice && (
                    <span className="original-price">${plan.originalPrice}</span>
                  )}
                  <span className="current-price">${plan.price}</span>
                  <span className="period">/{plan.period}</span>
                </div>
                {plan.discount && (
                  <div className="discount-badge">-{plan.discount}</div>
                )}
              </div>

              <ul className="plan-features">
                {plan.features.map((feature, index) => (
                  <li key={index}>
                    <span className="feature-icon">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`subscribe-button ${selectedPlan === plan.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSubscribe(plan.id);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? 'Обработка...' : 'Выбрать план'}
              </button>
            </div>
          ))}
        </div>

        <div className="paywall-footer">
          <p className="trial-info">
            💳 Все планы включают 3-дневный бесплатный пробный период
          </p>
          <p className="limit-info">
            🪙 Бесплатные пользователи: 3 токена в день
          </p>
          <p className="security-info">
            🔒 Безопасная оплата • Отмена в любое время
          </p>
        </div>
      </div>
    </div>
  );
}

export default Paywall;
