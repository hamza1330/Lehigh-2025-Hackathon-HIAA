import { useState, useEffect, useCallback } from 'react';
import { sessionsService, Session, SessionDetail, CreateSessionRequest, UpdateSessionRequest } from '../services/sessions';

// Custom hook for managing sessions
export const useSessions = (groupId?: string) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionsData = groupId 
        ? await sessionsService.getGroupSessions(groupId)
        : await sessionsService.getUserSessions();
      setSessions(sessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Create new session
  const createSession = useCallback(async (sessionData: CreateSessionRequest) => {
    try {
      const newSession = await sessionsService.createSession(sessionData);
      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
      throw err;
    }
  }, []);

  // Update session
  const updateSession = useCallback(async (sessionId: string, sessionData: UpdateSessionRequest) => {
    try {
      const updatedSession = await sessionsService.updateSession(sessionId, sessionData);
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await sessionsService.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.id !== sessionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete session');
      throw err;
    }
  }, []);

  // Join session
  const joinSession = useCallback(async (sessionId: string) => {
    try {
      await sessionsService.joinSession(sessionId);
      // Refresh sessions to get updated data
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      throw err;
    }
  }, [fetchSessions]);

  // Leave session
  const leaveSession = useCallback(async (sessionId: string) => {
    try {
      await sessionsService.leaveSession(sessionId);
      // Refresh sessions to get updated data
      await fetchSessions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
      throw err;
    }
  }, [fetchSessions]);

  // Start session
  const startSession = useCallback(async (sessionId: string) => {
    try {
      const updatedSession = await sessionsService.startSession(sessionId);
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    }
  }, []);

  // End session
  const endSession = useCallback(async (sessionId: string, notes?: string) => {
    try {
      const updatedSession = await sessionsService.endSession(sessionId, notes);
      setSessions(prev => prev.map(session => 
        session.id === sessionId ? updatedSession : session
      ));
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    }
  }, []);

  // Schedule session
  const scheduleSession = useCallback(async (groupId: string, startTime: string, notes?: string) => {
    try {
      const newSession = await sessionsService.scheduleSession(groupId, startTime, notes);
      setSessions(prev => [...prev, newSession]);
      return newSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule session');
      throw err;
    }
  }, []);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    joinSession,
    leaveSession,
    startSession,
    endSession,
    scheduleSession,
  };
};

// Custom hook for managing a single session
export const useSession = (sessionId: string) => {
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch session details
  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const sessionData = await sessionsService.getSessionById(sessionId);
      setSession(sessionData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch session');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Update session
  const updateSession = useCallback(async (sessionData: UpdateSessionRequest) => {
    if (!sessionId) return;
    
    try {
      const updatedSession = await sessionsService.updateSession(sessionId, sessionData);
      setSession(prev => prev ? { ...prev, ...updatedSession } : null);
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update session');
      throw err;
    }
  }, [sessionId]);

  // Join session
  const joinSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await sessionsService.joinSession(sessionId);
      // Refresh session to get updated participant list
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join session');
      throw err;
    }
  }, [sessionId, fetchSession]);

  // Leave session
  const leaveSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      await sessionsService.leaveSession(sessionId);
      // Refresh session to get updated participant list
      await fetchSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave session');
      throw err;
    }
  }, [sessionId, fetchSession]);

  // Start session
  const startSession = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const updatedSession = await sessionsService.startSession(sessionId);
      setSession(prev => prev ? { ...prev, ...updatedSession } : null);
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    }
  }, [sessionId]);

  // End session
  const endSession = useCallback(async (notes?: string) => {
    if (!sessionId) return;
    
    try {
      const updatedSession = await sessionsService.endSession(sessionId, notes);
      setSession(prev => prev ? { ...prev, ...updatedSession } : null);
      return updatedSession;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    }
  }, [sessionId]);

  // Load session on mount
  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    isLoading,
    error,
    fetchSession,
    updateSession,
    joinSession,
    leaveSession,
    startSession,
    endSession,
  };
};
