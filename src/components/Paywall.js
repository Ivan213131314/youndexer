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
      period: 'month',
             features: [
         'Pro model',
         'Search history',
         '100 tokens per month',
         '3 days free trial'
       ],
      popular: false,
      discount: null
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 18,
      originalPrice: null,
      period: 'month',
             features: [
         'Pro model',
         'Search history',
         '300 tokens per month',
         '3 days free trial'
       ],
      popular: true,
      discount: null
    },
    {
      id: 'lifetime',
      name: 'Lifetime',
      price: 98,
      originalPrice: 298,
      period: 'forever',
      features: [
        'Pro model',
        'Search history',
        'Unlimited tokens',
        'Lifetime access',
        'All future updates'
      ],
      popular: false,
      discount: '67%'
    }
  ];

  const handleSubscribe = async (planId) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    try {
      // Purchase subscription
      const success = await purchaseSubscription(user.uid, planId);
      
      if (success) {
        console.log('Subscription successfully purchased:', planId);
        
        // Update tokens in context
        const { getUserTokens } = await import('../utils/tokenService');
        const updatedTokens = await getUserTokens(user.uid);
        setUserTokens(updatedTokens);
        
        if (onSubscribe) {
          await onSubscribe(planId);
        }
      } else {
        console.error('Error purchasing subscription');
        alert('Error purchasing subscription. Please try again.');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      alert('Error purchasing subscription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="paywall-overlay">
      <div className="paywall-modal">
        <div className="paywall-header">
          <h2>Choose Subscription Plan</h2>
          <p>Get access to advanced features</p>
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
                <div className="popular-badge">Popular</div>
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
                {isProcessing ? 'Processing...' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        <div className="paywall-footer">
          <p className="trial-info">
            💳 All plans include 3-day free trial
          </p>
          <p className="limit-info">
            🪙 Free users: 3 tokens per day
          </p>
          <p className="security-info">
            🔒 Secure payment • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}

export default Paywall;
