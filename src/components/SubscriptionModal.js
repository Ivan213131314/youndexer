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
      period: 'month',
      features: [
        'Pro model',
        'Search history',
        '100 tokens per month',
        '3 days free trial'
      ],
      popular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 18,
      period: 'month',
      features: [
        'Pro model',
        'Search history',
        '300 tokens per month',
        '3 days free trial'
      ],
      popular: true
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

  const handleUpgrade = async (planId) => {
    setIsProcessing(true);
    try {
      console.log('Upgrading subscription to plan:', planId);
      // Here will be subscription upgrade logic
      alert(`Subscription upgraded to plan: ${planId}`);
      onClose();
    } catch (error) {
      console.error('Error upgrading subscription:', error);
      alert('Error upgrading subscription');
    } finally {
      setIsProcessing(false);
    }
  };

    const handleCancelSubscription = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription? After cancellation, you will return to the free plan.')) {
      setIsProcessing(true);
      try {
        console.log('Cancelling subscription for user:', user?.uid);
        
        // Cancel subscription
        const success = await cancelSubscription(user.uid);
        
        if (success) {
          console.log('Subscription successfully cancelled');
          
          // Update tokens in context
          const updatedTokens = await getUserTokens(user.uid);
          if (updatedTokens) {
            setUserTokens(updatedTokens);
          }
          
          alert('Subscription cancelled. You have returned to the free plan.');
          onClose();
        } else {
          console.error('Error cancelling subscription');
          alert('Error cancelling subscription. Please try again.');
        }
      } catch (error) {
        console.error('Error cancelling subscription:', error);
        alert('Error cancelling subscription');
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
           <h2>Subscription Management</h2>
           <button className="subscription-modal-close" onClick={onClose}>
             ✕
           </button>
         </div>

        <div className="subscription-modal-content">
                     {/* Current Subscription */}
           <div className="current-subscription">
             <h3>Current Subscription</h3>
             <div className="current-plan">
               <span className={`plan-badge ${currentSubscription}`}>
                 {currentSubscription === 'free' ? 'Free' : 
                  currentSubscription === 'pro' ? 'Pro' : 
                  currentSubscription === 'premium' ? 'Premium' : 'Lifetime'}
               </span>
               <span className="plan-description">
                 {currentSubscription === 'free' ? '3 tokens per day' :
                  currentSubscription === 'pro' ? '100 tokens per month' :
                  currentSubscription === 'premium' ? '300 tokens per month' : 'Unlimited tokens'}
               </span>
             </div>
           </div>

          <div className="subscription-divider"></div>

                     {/* Upgrade Plans */}
           <div className="upgrade-section">
             <h3>Upgrade Subscription</h3>
            <div className="plans-grid">
              {plans.map((plan) => (
                <div 
                  key={plan.id}
                  className={`plan-card ${plan.popular ? 'popular' : ''} ${selectedPlan === plan.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                                     {plan.popular && <div className="popular-badge">Popular</div>}
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
                     {isProcessing ? 'Processing...' : 'Select Plan'}
                   </button>
                </div>
              ))}
            </div>
          </div>

                     {/* Cancel Subscription Button */}
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
