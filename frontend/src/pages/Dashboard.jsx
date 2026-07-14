import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { meetingsAPI } from '../api/meetings';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [meetingTitle, setMeetingTitle] = useState('');
  const [joinMeetingId, setJoinMeetingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRecentMeetings = async () => {
    try {
      const response = await meetingsAPI.getMyMeetings();
      setRecentMeetings(response.data.data);
      setError('');
    } catch (requestError) {
      console.error('Failed to load meetings:', requestError);
      setError('Could not load your recent meetings.');
    }
  };

  useEffect(() => {
    loadRecentMeetings();
  }, []);

  const createMeeting = async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError('');
      const response = await meetingsAPI.createMeeting(meetingTitle || 'Quick Meeting');
      navigate(`/meeting/${response.data.data.meetingId}`);
    } catch (requestError) {
      console.error('Failed to create meeting:', requestError);
      setError('Could not create the meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = () => {
    const meetingId = joinMeetingId.trim();
    if (!meetingId) {
      setError('Enter a meeting ID to continue.');
      return;
    }
    setError('');
    navigate(`/meeting/${meetingId}`);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setMessage('Meeting ID copied.');
    } catch {
      setError('Could not copy the meeting ID.');
    }
  };

  const handleKeyDown = (event, action) => {
    if (event.key === 'Enter') action();
  };

  const displayName = user?.name || 'there';
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'X';

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <img className="product-logo" src="/xzoom-logo.svg" alt="XZoom" />

          <div className="account-menu">
            <div className="account-summary">
              <span className="account-avatar" aria-hidden="true">{initial}</span>
              <span>{user?.name}</span>
            </div>
            <button className="text-action" type="button" onClick={logout}>Sign out</button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="dashboard-welcome" aria-labelledby="dashboard-title">
          <p className="ui-eyebrow">Your meeting space</p>
          <h1 id="dashboard-title">Welcome back, <span>{displayName}.</span></h1>
          <p>Create a new room or join one with a meeting ID.</p>
        </section>

        {(error || message) && (
          <div className={`dashboard-notice ${error ? 'is-error' : ''}`} role={error ? 'alert' : 'status'}>
            <span>{error || message}</span>
            <button type="button" onClick={() => { setError(''); setMessage(''); }} aria-label="Dismiss message">×</button>
          </div>
        )}

        <section className="meeting-actions" aria-label="Meeting actions">
          <article className="meeting-action-card">
            <div className="action-heading">
              <span className="action-number">01</span>
              <div>
                <h2>Create a meeting</h2>
                <p>Start a room and share its meeting ID.</p>
              </div>
            </div>
            <div className="action-form">
              <label htmlFor="meeting-title">Meeting title <span>Optional</span></label>
              <input
                id="meeting-title"
                type="text"
                value={meetingTitle}
                onChange={(event) => setMeetingTitle(event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, createMeeting)}
                placeholder="Quick Meeting"
              />
              <button className="primary-action" type="button" onClick={createMeeting} disabled={loading}>
                {loading ? <><span className="button-spinner" aria-hidden="true" />Creating…</> : 'Create meeting'}
              </button>
            </div>
          </article>

          <article className="meeting-action-card">
            <div className="action-heading">
              <span className="action-number">02</span>
              <div>
                <h2>Join a meeting</h2>
                <p>Enter the ID shared by the meeting host.</p>
              </div>
            </div>
            <div className="action-form">
              <label htmlFor="meeting-id">Meeting ID</label>
              <input
                id="meeting-id"
                type="text"
                value={joinMeetingId}
                onChange={(event) => setJoinMeetingId(event.target.value.toUpperCase())}
                onKeyDown={(event) => handleKeyDown(event, joinMeeting)}
                placeholder="Enter meeting ID"
                autoCapitalize="characters"
              />
              <button className="secondary-action" type="button" onClick={joinMeeting}>Join meeting</button>
            </div>
          </article>
        </section>

        <section className="recent-section" aria-labelledby="recent-title">
          <div className="section-title-row">
            <div>
              <p className="ui-eyebrow">History</p>
              <h2 id="recent-title">Meetings you created</h2>
            </div>
            <button className="text-action" type="button" onClick={loadRecentMeetings}>Refresh</button>
          </div>

          {recentMeetings.length === 0 ? (
            <div className="empty-meetings">
              <span className="empty-mark" aria-hidden="true">00</span>
              <h3>No meetings yet</h3>
              <p>Create your first meeting and it will appear here.</p>
            </div>
          ) : (
            <div className="meeting-list">
              {recentMeetings.map((meeting, index) => (
                <article className="meeting-list-item" key={meeting._id}>
                  <span className="meeting-index">{String(index + 1).padStart(2, '0')}</span>
                  <div className="meeting-details">
                    <h3>{meeting.title}</h3>
                    <p>{new Date(meeting.createdAt).toLocaleDateString()}</p>
                  </div>
                  <code>{meeting.meetingId}</code>
                  <div className="meeting-item-actions">
                    <button className="icon-action" type="button" onClick={() => copyToClipboard(meeting.meetingId)} aria-label={`Copy ID for ${meeting.title}`} title="Copy meeting ID">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2V8Z"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>
                    </button>
                    <button className="small-action" type="button" onClick={() => navigate(`/meeting/${meeting.meetingId}`)}>Join</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
