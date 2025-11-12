import React, { useState } from 'react';
import './Pricing.css';
import PricingCard from './PricingCard';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Basic',
      price: 'Free',
      description: 'Perfect for personal use and small teams getting started',
      features: [
        'Up to 100 participants',
        '40 minute meeting limit',
        'Unlimited 1-on-1 meetings',
        'Video conferencing',
        'Screen sharing',
        'Basic whiteboard'
      ],
      buttonText: 'Sign Up Free',
      popular: false
    },
    {
      name: 'Pro',
      monthlyPrice: '$15.99',
      annualPrice: '$12.79',
      description: 'For small teams that need more meeting time and features',
      features: [
        'Up to 100 participants',
        '30 hour meeting limit',
        'Cloud recording (5GB)',
        'Custom meeting IDs',
        'Scheduling tools',
        'Reporting and analytics'
      ],
      buttonText: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'For large organizations with advanced needs',
      features: [
        'Up to 1,000 participants',
        'Unlimited meeting time',
        'Unlimited cloud storage',
        'Dedicated support',
        'Advanced security',
        'Custom integrations'
      ],
      buttonText: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <section id="plans">
      <div className="section-header">
        <h2>Choose Your Plan</h2>
        <p>Flexible pricing that scales with your needs</p>
      </div>
      
      <div className="pricing-toggle">
        <span className="toggle-label">Monthly</span>
        <div 
          className={`toggle-switch ${isAnnual ? 'active' : ''}`}
          onClick={() => setIsAnnual(!isAnnual)}
        >
          <div className="toggle-slider"></div>
        </div>
        <span className="toggle-label">Annual <span style={{color: '#2D8CFF'}}>(Save 20%)</span></span>
      </div>

      <div className="pricing-grid">
        {plans.map((plan, index) => (
          <PricingCard 
            key={index} 
            plan={plan} 
            isAnnual={isAnnual}
          />
        ))}
      </div>
    </section>
  );
};

export default Pricing;