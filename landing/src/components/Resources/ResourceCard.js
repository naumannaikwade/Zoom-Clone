import React, { useState } from 'react';

const ResourceCard = ({ icon, tag, title, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`resource-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="resource-image">{icon}</div>
      <div className="resource-content">
        <span className="resource-tag">{tag}</span>
        <h3>{title}</h3>
        <p>{description}</p>
        <a href="#" className="learn-more">Learn More →</a>
      </div>
    </div>
  );
};

export default ResourceCard;