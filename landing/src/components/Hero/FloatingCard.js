import React from 'react';

const FloatingCard = ({ className, icon, title, description }) => {
  return (
    <div className={`floating-card ${className}`}>
      <div className="card-icon">{icon}</div>
      <div className="card-title">{title}</div>
      <div className="card-desc">{description}</div>
    </div>
  );
};

export default FloatingCard;