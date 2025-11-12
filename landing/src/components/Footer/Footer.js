import React from 'react';
import './Footer.css';
import { useSmoothScroll } from '../../hooks/useScroll';

const Footer = () => {
  const { scrollToTop } = useSmoothScroll();

  const footerSections = [
    {
      title: 'About',
      links: [
        { text: 'XZoom Blog', href: '#' },
        { text: 'Careers', href: '#' },
        { text: 'Press', href: '#' },
        { text: 'Investors', href: '#' },
        { text: 'ESG', href: '#' }
      ]
    },
    {
      title: 'Products',
      links: [
        { text: 'Meetings', href: '#' },
        { text: 'Team Chat', href: '#' },
        { text: 'Phone', href: '#' },
        { text: 'Rooms', href: '#' },
        { text: 'Whiteboard', href: '#' }
      ]
    },
    {
      title: 'Download',
      links: [
        { text: 'Client', href: '#' },
        { text: 'XZoom Rooms', href: '#' },
        { text: 'Browser Extension', href: '#' },
        { text: 'Outlook Plugin', href: '#' },
        { text: 'Mobile App', href: '#' }
      ]
    },
    {
      title: 'Support',
      links: [
        { text: 'Help Center', href: '#' },
        { text: 'Learning Center', href: '#' },
        { text: 'Contact Us', href: '#' },
        { text: 'Developer Tools', href: '#' },
        { text: 'Status', href: '#' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { text: 'Terms', href: '#' },
        { text: 'Privacy', href: '#' },
        { text: 'Trust & Safety', href: '#' },
        { text: 'Acceptable Use', href: '#' },
        { text: 'Cookie Preferences', href: '#' }
      ]
    }
  ];

  const socialLinks = [
    { icon: '📘', name: 'Facebook', href: '#' },
    { icon: '🐦', name: 'Twitter', href: '#' },
    { icon: '📷', name: 'Instagram', href: '#' },
    { icon: '💼', name: 'LinkedIn', href: '#' },
    { icon: '🎬', name: 'YouTube', href: '#' }
  ];

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="logo" onClick={scrollToTop}>XZoom</div>
            <p className="footer-description">
              One platform to connect. Bringing together meetings, chat, phone, whiteboard, and more in one powerful solution.
            </p>
            <div className="social-links">
              {socialLinks.map((social, index) => (
                <a 
                  key={index}
                  href={social.href}
                  className="social-link"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          <div className="footer-links-grid">
            {footerSections.map((section, index) => (
              <div key={index} className="footer-section">
                <h4 className="footer-section-title">{section.title}</h4>
                <ul className="footer-links">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href={link.href} className="footer-link">{link.text}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>© 2024 XZoom Video Communications, Inc. All rights reserved.</p>
            </div>
            <div className="footer-legal">
              <span>English</span>
              <span>India, Jaysingpur</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;