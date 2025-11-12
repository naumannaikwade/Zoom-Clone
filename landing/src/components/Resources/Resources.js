import React from 'react';
import './Resources.css';
import ResourceCard from './ResourceCard';

const Resources = () => {
  const resources = [
    {
      icon: '📚',
      tag: 'GUIDE',
      title: 'Getting Started Guide',
      description: 'Learn the basics of Zoom and start hosting meetings in minutes with our comprehensive guide.'
    },
    {
      icon: '🎥',
      tag: 'VIDEO',
      title: 'Video Tutorials',
      description: 'Watch step-by-step tutorials on how to use advanced features and maximize productivity.'
    },
    {
      icon: '💡',
      tag: 'BLOG',
      title: 'Best Practices',
      description: 'Discover tips, tricks, and best practices from our experts and community members.'
    },
    {
      icon: '🛠️',
      tag: 'DOCS',
      title: 'Developer API',
      description: 'Build custom integrations and applications with our comprehensive API documentation.'
    },
    {
      icon: '🎓',
      tag: 'WEBINAR',
      title: 'Live Training Sessions',
      description: 'Join our free live training sessions to learn directly from Zoom experts.'
    },
    {
      icon: '👥',
      tag: 'COMMUNITY',
      title: 'Community Forum',
      description: 'Connect with other users, share experiences, and get answers to your questions.'
    }
  ];

  return (
    <section id="resources">
      <div className="section-header">
        <h2>Resources & Learning</h2>
        <p>Everything you need to get the most out of XZoom</p>
      </div>
      <div className="resources-grid">
        {resources.map((resource, index) => (
          <ResourceCard key={index} {...resource} />
        ))}
      </div>
    </section>
  );
};

export default Resources;