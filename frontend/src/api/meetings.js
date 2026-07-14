import api from './base';

export const meetingsAPI = {
  createMeeting: (title) => 
    api.post('/meetings', { title }),
  
  getMeeting: (meetingId) => 
    api.get(`/meetings/${meetingId}`),
  
  getMyMeetings: () => 
    api.get('/meetings/history/my-meetings'),
  
  endMeeting: (meetingId) => 
    api.post(`/meetings/${meetingId}/end`)
};