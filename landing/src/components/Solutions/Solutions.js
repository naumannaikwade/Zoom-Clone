import React from 'react';
import './Solutions.css';
import SolutionCard from './SolutionCard';

const Solutions = () => {
  const solutions = [
    { icon: '🏢', title: 'Enterprise', description: 'Scale your business with powerful collaboration tools, advanced security, and dedicated support for organizations of any size.' },
    { icon: '🎓', title: 'Education', description: 'Empower learning with interactive virtual classrooms, breakout rooms, and tools designed for educators and students.' },
    { icon: '🏥', title: 'Healthcare', description: 'HIPAA-compliant telehealth solutions that enable secure virtual care delivery and patient consultations.' },
    { icon: '💼', title: 'Small Business', description: 'Get professional video meetings and collaboration tools with flexible plans that grow with your business.' },
    { icon: '🛒', title: 'Retail', description: 'Connect teams across locations, provide virtual shopping experiences, and streamline operations with video.' },
    { icon: '🏗️', title: 'Construction', description: 'Collaborate on projects, conduct remote site inspections, and keep teams connected across job sites.' }
  ];

  return (
    <section id="solutions">
      <div className="section-header">
        <h2>Solutions for Every Team</h2>
        <p>Whether you're a small business or enterprise, we have the perfect solution for your needs</p>
      </div>
      <div className="solutions-grid">
        {solutions.map((solution, index) => (
          <SolutionCard key={index} {...solution} />
        ))}
      </div>
    </section>
  );
};

export default Solutions;