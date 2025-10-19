// Export all API services
export { api, ApiResponse, PaginatedResponse } from './api';
export { authService, tokenManager, type LoginRequest, type RegisterRequest, type AuthResponse, type UserProfile } from './auth';
export { groupsService, type Group, type GroupMember, type GroupDetail, type CreateGroupRequest, type UpdateGroupRequest } from './groups';
export { sessionsService, type Session, type SessionParticipant, type SessionDetail, type CreateSessionRequest, type UpdateSessionRequest } from './sessions';
export { notificationsService, type Notification, type NotificationSettings, type NotificationStats } from './notifications';

// Re-export commonly used types
export type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  UserProfile,
  Group,
  GroupMember,
  GroupDetail,
  CreateGroupRequest,
  UpdateGroupRequest,
  Session,
  SessionParticipant,
  SessionDetail,
  CreateSessionRequest,
  UpdateSessionRequest,
  Notification,
  NotificationSettings,
  NotificationStats,
} from './auth';
