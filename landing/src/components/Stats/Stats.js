import React from 'react';
import './Stats.css';
import { useCounter } from '../../hooks/useCounter';

const Stats = () => {
  const { count: participants, elementRef: participantsRef } = useCounter(300);
  const { count: organizations, elementRef: organizationsRef } = useCounter(500);
  const { count: minutes, elementRef: minutesRef } = useCounter(30);

  return (
    <section className="stats">
      <div className="stats-grid">
        <div className="stat-item">
          <h3 ref={participantsRef}>{participants}M+</h3>
          <p>Daily Meeting Participants</p>
        </div>
        <div className="stat-item">
          <h3 ref={organizationsRef}>{organizations}K+</h3>
          <p>Customer Organizations</p>
        </div>
        <div className="stat-item">
          <h3>99.9%</h3>
          <p>Uptime SLA</p>
        </div>
        <div className="stat-item">
          <h3 ref={minutesRef}>{minutes}B+</h3>
          <p>Annual Meeting Minutes</p>
        </div>
      </div>
    </section>
  );
};

export default Stats;