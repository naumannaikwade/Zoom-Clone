import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useScroll, useSmoothScroll } from '../../hooks/useScroll';
import './Header.css';

const Header = () => {
  const scrolled = useScroll();
  const { scrollToSection, scrollToTop } = useSmoothScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavClick = (sectionId) => {
    scrollToSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleSignUpClick = () => {
    // Redirect to external URL
    window.open('https://xzoomfrontend.onrender.com', '_blank');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} id="header">
      <div className="logo" onClick={scrollToTop}>XZoom</div>
      
      <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
        <a onClick={() => handleNavClick('solutions')}>Solutions</a>
        <a onClick={() => handleNavClick('products')}>Products</a>
        <a onClick={() => handleNavClick('resources')}>Resources</a>
        <a onClick={() => handleNavClick('plans')}>Plans & Pricing</a>
        
        {/* External link for Sign Up Free */}
        <a 
          className="signup-btn" 
          onClick={handleSignUpClick}
          style={{ cursor: 'pointer' }}
        >
          SIGN IN
        </a>
      </nav>

      <button 
        className="mobile-menu-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </header>
  );
};

export default Header;