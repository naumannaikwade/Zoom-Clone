import React from 'react';

const ProductTab = ({ product, isActive }) => {
  if (!isActive) return null;

  return (
    <div className="product-content active">
      <div className="product-info">
        <h3>{product.title}</h3>
        <p>{product.description}</p>
        <ul className="product-features">
          {product.features.map((feature, index) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
        <button className="primary-btn">Start Free Trial</button>
      </div>
      <div className="product-visual">
        {product.icon}
      </div>
    </div>
  );
};

export default ProductTab;