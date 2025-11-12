import React, { useState } from 'react';
import './Products.css';
import ProductTab from './ProductTab';

const Products = () => {
  const [activeProduct, setActiveProduct] = useState('meetings');

  const products = {
    meetings: {
      title: 'XZoom Meetings',
      description: 'Host unlimited meetings with up to 1,000 participants. Share screens, record sessions, and collaborate in real-time with HD video and audio.',
      features: [
        'Up to 1,000 participants per meeting',
        'Unlimited one-on-one meetings',
        'Screen sharing and annotation',
        'Recording and transcription',
        'Virtual backgrounds and filters',
        'Breakout rooms for collaboration'
      ],
      icon: '📹'
    },
    'team-chat': {
      title: 'XZoom Team Chat',
      description: 'Keep conversations organized with persistent chat channels, file sharing, and seamless integration with Zoom Meetings.',
      features: [
        'Unlimited channels and direct messages',
        'File sharing and collaboration',
        'Message search and history',
        'Integration with 1,000+ apps',
        'Custom emojis and reactions',
        'Priority inbox and starred messages'
      ],
      icon: '💬'
    },
    phone: {
      title: 'XZoom Phone',
      description: 'Cloud phone system that works seamlessly with your Zoom experience. Make and receive calls from anywhere.',
      features: [
        'Unlimited domestic calling',
        'SMS and MMS messaging',
        'Call recording and voicemail',
        'Auto attendant and call queues',
        'Desktop and mobile apps',
        'Advanced analytics and reporting'
      ],
      icon: '📱'
    },
    whiteboard: {
      title: 'XZoom Whiteboard',
      description: 'Collaborate visually with an infinite canvas for brainstorming, planning, and creating together in real-time.',
      features: [
        'Infinite canvas for unlimited ideas',
        'Real-time collaboration',
        'Templates and shapes library',
        'Sticky notes and annotations',
        'Export to PDF and images',
        'Integration with Zoom Meetings'
      ],
      icon: '📊'
    }
  };

  return (
    <section id="products">
      <div className="section-header">
        <h2>Our Products</h2>
        <p>Everything you need to collaborate in one platform</p>
      </div>
      <div className="products-container">
        <div className="product-tabs">
          {Object.keys(products).map((productKey) => (
            <button
              key={productKey}
              className={`tab-btn ${activeProduct === productKey ? 'active' : ''}`}
              onClick={() => setActiveProduct(productKey)}
            >
              {products[productKey].title.split(' ')[1]}
            </button>
          ))}
        </div>
        
        <ProductTab product={products[activeProduct]} isActive={true} />
      </div>
    </section>
  );
};

export default Products;