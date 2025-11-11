import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadRecentMeetings();
  }, []);

  const loadRecentMeetings = async () => {
    try {
      const response = await meetingsAPI.getMyMeetings();
      setRecentMeetings(response.data.data);
    } catch (error) {
      console.error('Failed to load meetings:', error);
    }
  };

  const createMeeting = async () => {
    if (loading) return;
    
    try {
      setLoading(true);
      const response = await meetingsAPI.createMeeting(meetingTitle || 'Quick Meeting');
      const meeting = response.data.data;
      navigate(`/meeting/${meeting.meetingId}`);
    } catch (error) {
      console.error('Failed to create meeting:', error);
      alert('Failed to create meeting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = () => {
    if (!joinMeetingId.trim()) {
      alert('Please enter a meeting ID');
      return;
    }
    navigate(`/meeting/${joinMeetingId.trim()}`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Meeting ID copied to clipboard!');
  };

  const handleKeyPress = (e, action) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <div className="min-h-screen bg-[#232333]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-[#2d8cff] rounded-xl flex items-center justify-center shadow-md">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-[#232333]">VideoMeet</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#2d8cff] rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="text-[#232333] text-sm">Welcome, {user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="bg-[#747487] hover:bg-[#5a5a6c] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name}!
          </h2>
          <p className="text-[#747487] text-lg">
            Start or join a video meeting instantly
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Create Meeting Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-transform duration-200 hover:shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#2d8cff] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#232333]">Create New Meeting</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232333] mb-2">
                  Meeting Title (Optional)
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, createMeeting)}
                  placeholder="Quick Meeting"
                  className="w-full px-4 py-3 bg-white border border-[#747487]/30 rounded-xl text-[#232333] placeholder-[#747487] focus:outline-none focus:ring-2 focus:ring-[#2d8cff]/50 focus:border-[#2d8cff] transition-all duration-200"
                />
              </div>
              <button
                onClick={createMeeting}
                disabled={loading}
                className="w-full bg-[#2d8cff] hover:bg-[#1a7ae8] text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Meeting...
                  </div>
                ) : (
                  'Create Meeting'
                )}
              </button>
            </div>
          </div>

          {/* Join Meeting Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 transition-transform duration-200 hover:shadow-xl">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-[#f26d21] rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-[#232333]">Join Meeting</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#232333] mb-2">
                  Meeting ID
                </label>
                <input
                  type="text"
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value.toUpperCase())}
                  onKeyPress={(e) => handleKeyPress(e, joinMeeting)}
                  placeholder="Enter meeting code"
                  className="w-full px-4 py-3 bg-white border border-[#747487]/30 rounded-xl text-[#232333] placeholder-[#747487] focus:outline-none focus:ring-2 focus:ring-[#2d8cff]/50 focus:border-[#2d8cff] transition-all duration-200 uppercase"
                />
              </div>
              <button
                onClick={joinMeeting}
                className="w-full bg-[#f26d21] hover:bg-[#da5d17] text-white py-3 px-6 rounded-xl font-medium transition-all duration-200 transform hover:scale-[1.02]"
              >
                Join Meeting
              </button>
            </div>
          </div>
        </div>

        {/* Recent Meetings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#232333]">Recent Meetings</h2>
            <button
              onClick={loadRecentMeetings}
              className="text-[#2d8cff] hover:text-[#1a7ae8] text-sm font-medium transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
          
          {recentMeetings.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-[#747487] mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[#747487] text-lg">No recent meetings</p>
              <p className="text-[#747487] text-sm mt-2">Create your first meeting to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentMeetings.map((meeting) => (
                <div key={meeting._id} className="border border-[#747487]/20 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-[#232333] text-sm line-clamp-2 flex-1 mr-2">
                      {meeting.title}
                    </h3>
                    <button
                      onClick={() => copyToClipboard(meeting.meetingId)}
                      className="text-[#747487] hover:text-[#2d8cff] transition-colors duration-200 flex-shrink-0"
                      title="Copy Meeting ID"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-xs text-[#747487]">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      ID: {meeting.meetingId}
                    </div>
                    <div className="flex items-center text-xs text-[#747487]">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(meeting.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/meeting/${meeting.meetingId}`)}
                    className="w-full bg-[#2d8cff] hover:bg-[#1a7ae8] text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-200"
                  >
                    Join Meeting
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;