import { api, ApiResponse, PaginatedResponse } from './api';

// Session types
export interface Session {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  joined_at: string;
  left_at?: string;
  status: 'active' | 'left' | 'completed';
}

export interface SessionDetail extends Session {
  participants: SessionParticipant[];
  group_name: string;
  group_description: string;
}

export interface CreateSessionRequest {
  group_id: string;
  start_time: string;
  notes?: string;
}

export interface UpdateSessionRequest {
  start_time?: string;
  end_time?: string;
  notes?: string;
  status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
}

export interface JoinSessionRequest {
  session_id: string;
}

export interface SessionStats {
  total_sessions: number;
  total_hours_logged: number;
  average_session_duration: number;
  longest_session: number;
  current_streak: number;
  longest_streak: number;
}

export interface GroupSessionStats {
  group_id: string;
  group_name: string;
  total_sessions: number;
  total_hours_logged: number;
  active_sessions: number;
  upcoming_sessions: number;
  member_stats: {
    user_id: string;
    username: string;
    sessions_count: number;
    hours_logged: number;
  }[];
}

// Sessions service
export const sessionsService = {
  // Get sessions for a group
  getGroupSessions: async (groupId: string, status?: string): Promise<Session[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Session[]>(`/api/v1/groups/${groupId}/sessions`, params);
    return response.data.data;
  },

  // Get user's sessions
  getUserSessions: async (status?: string): Promise<Session[]> => {
    const params = status ? { status } : {};
    const response = await api.get<Session[]>('/api/v1/sessions', params);
    return response.data.data;
  },

  // Get session by ID
  getSessionById: async (sessionId: string): Promise<SessionDetail> => {
    const response = await api.get<SessionDetail>(`/api/v1/sessions/${sessionId}`);
    return response.data.data;
  },

  // Create new session
  createSession: async (sessionData: CreateSessionRequest): Promise<Session> => {
    const response = await api.post<Session>('/api/v1/sessions', sessionData);
    return response.data.data;
  },

  // Update session
  updateSession: async (sessionId: string, sessionData: UpdateSessionRequest): Promise<Session> => {
    const response = await api.put<Session>(`/api/v1/sessions/${sessionId}`, sessionData);
    return response.data.data;
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/api/v1/sessions/${sessionId}`);
  },

  // Join session
  joinSession: async (sessionId: string): Promise<SessionParticipant> => {
    const response = await api.post<SessionParticipant>(`/api/v1/sessions/${sessionId}/join`);
    return response.data.data;
  },

  // Leave session
  leaveSession: async (sessionId: string): Promise<void> => {
    await api.post(`/api/v1/sessions/${sessionId}/leave`);
  },

  // Start session (clock in)
  startSession: async (sessionId: string): Promise<Session> => {
    const response = await api.post<Session>(`/api/v1/sessions/${sessionId}/start`);
    return response.data.data;
  },

  // End session (clock out)
  endSession: async (sessionId: string, notes?: string): Promise<Session> => {
    const response = await api.post<Session>(`/api/v1/sessions/${sessionId}/end`, { notes });
    return response.data.data;
  },

  // Get session participants
  getSessionParticipants: async (sessionId: string): Promise<SessionParticipant[]> => {
    const response = await api.get<SessionParticipant[]>(`/api/v1/sessions/${sessionId}/participants`);
    return response.data.data;
  },

  // Get user's session statistics
  getUserSessionStats: async (): Promise<SessionStats> => {
    const response = await api.get<SessionStats>('/api/v1/sessions/stats');
    return response.data.data;
  },

  // Get group session statistics
  getGroupSessionStats: async (groupId: string): Promise<GroupSessionStats> => {
    const response = await api.get<GroupSessionStats>(`/api/v1/groups/${groupId}/session-stats`);
    return response.data.data;
  },

  // Get upcoming sessions
  getUpcomingSessions: async (limit: number = 10): Promise<Session[]> => {
    const response = await api.get<Session[]>('/api/v1/sessions/upcoming', { limit });
    return response.data.data;
  },

  // Get active sessions
  getActiveSessions: async (): Promise<Session[]> => {
    const response = await api.get<Session[]>('/api/v1/sessions/active');
    return response.data.data;
  },

  // Schedule session
  scheduleSession: async (groupId: string, startTime: string, notes?: string): Promise<Session> => {
    const response = await api.post<Session>('/api/v1/sessions/schedule', {
      group_id: groupId,
      start_time: startTime,
      notes,
    });
    return response.data.data;
  },

  // Get session history
  getSessionHistory: async (groupId?: string, limit: number = 20, offset: number = 0): Promise<{
    sessions: Session[];
    total: number;
    has_more: boolean;
  }> => {
    const params = { limit, offset };
    if (groupId) {
      params.group_id = groupId;
    }
    const response = await api.get('/api/v1/sessions/history', params);
    return response.data.data;
  },
};
