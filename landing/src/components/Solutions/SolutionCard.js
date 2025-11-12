import React, { useState } from 'react';

const SolutionCard = ({ icon, title, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`solution-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="solution-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      <a href="#" className="learn-more">Learn More →</a>
    </div>
  );
};

export default SolutionCard;