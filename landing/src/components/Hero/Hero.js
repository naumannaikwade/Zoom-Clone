import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';
import FloatingCard from './FloatingCard';
import Particles from './Particles';

const Hero = () => {

  const handleSignUpClick = () => {
    // Redirect to external URL
    window.open('https://xzoomfrontend.onrender.com/register', '_blank');
  };

  return (
    <section className="hero">
      <Particles />
      <div className="hero-content">
        <div className="hero-text">
          <h1>Connect from anywhere, work together always</h1>
          <p>One platform to bring teams together with meetings, team chat, phone, and more in a flexible, reliable, and secure solution.</p>
          <div className="hero-buttons">
            {/* External link for Sign Up Free */}
            <a 
              className="primary-btn" 
              onClick={handleSignUpClick}
              style={{ cursor: 'pointer' }}
            >
              Get Started
            </a>
            
            {/* <Link to="/" className="secondary-btn">
              Request a Demo
            </Link> */}
          </div>
          <div className="hero-features">
            <span>✓ No credit card required</span>
            <span>✓ Free plan available</span>
            <span>✓ Enterprise-grade security</span>
          </div>
        </div>
        <div className="hero-visual">
          <FloatingCard 
            className="card1"
            icon="📹"
            title="HD Video & Audio"
            description="Crystal clear quality for every conversation"
          />
          <FloatingCard 
            className="card2"
            icon="🔒"
            title="Enterprise Security"
            description="Bank-level encryption for your peace of mind"
          />
          <FloatingCard 
            className="card3"
            icon="🌐"
            title="Global Reach"
            description="Connect with anyone, anywhere in the world"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;