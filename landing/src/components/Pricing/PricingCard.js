import React, { useState } from 'react';

const PricingCard = ({ plan, isAnnual }) => {
  const [isHovered, setIsHovered] = useState(false);

  const displayPrice = plan.price || (isAnnual ? plan.annualPrice : plan.monthlyPrice);

  return (
    <div 
      className={`pricing-card ${plan.popular ? 'popular' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {plan.popular && <div className="popular-badge">MOST POPULAR</div>}
      
      <div className="plan-name">{plan.name}</div>
      <div className="plan-price">
        {displayPrice}
        {!plan.price && <span>/month</span>}
      </div>
      <div className="plan-desc">{plan.description}</div>
      
      <ul className="plan-features">
        {plan.features.map((feature, index) => (
          <li key={index}>{feature}</li>
        ))}
      </ul>
      
      <button className="plan-btn">{plan.buttonText}</button>
    </div>
  );
};

export default PricingCard;