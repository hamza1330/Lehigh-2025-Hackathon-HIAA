import { api, ApiResponse, PaginatedResponse } from './api';

// Group types
export interface Group {
  id: string;
  name: string;
  description: string;
  target_hours_per_member: number;
  cadence_days: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'paused' | 'completed';
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  joined_at: string;
  status: 'active' | 'paused' | 'left';
  total_hours_logged: number;
  current_period_hours: number;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
  current_period_start: string;
  current_period_end: string;
}

export interface CreateGroupRequest {
  name: string;
  description: string;
  target_hours_per_member: number;
  cadence_days: number;
  invite_usernames?: string[];
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  target_hours_per_member?: number;
  cadence_days?: number;
  status?: 'active' | 'paused' | 'completed';
}

export interface InviteMemberRequest {
  username: string;
}

export interface GroupProgress {
  group_id: string;
  period_start: string;
  period_end: string;
  total_target_hours: number;
  total_logged_hours: number;
  member_progress: {
    user_id: string;
    username: string;
    target_hours: number;
    logged_hours: number;
    status: 'on_track' | 'behind' | 'ahead';
  }[];
}

// Groups service
export const groupsService = {
  // Get all groups for current user
  getGroups: async (): Promise<Group[]> => {
    const response = await api.get<Group[]>('/api/v1/groups');
    return response.data.data;
  },

  // Get group by ID with details
  getGroupById: async (groupId: string): Promise<GroupDetail> => {
    const response = await api.get<GroupDetail>(`/api/v1/groups/${groupId}`);
    return response.data.data;
  },

  // Create new group
  createGroup: async (groupData: CreateGroupRequest): Promise<Group> => {
    const response = await api.post<Group>('/api/v1/groups', groupData);
    return response.data.data;
  },

  // Update group
  updateGroup: async (groupId: string, groupData: UpdateGroupRequest): Promise<Group> => {
    const response = await api.put<Group>(`/api/v1/groups/${groupId}`, groupData);
    return response.data.data;
  },

  // Delete group
  deleteGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/api/v1/groups/${groupId}`);
  },

  // Join group
  joinGroup: async (groupId: string): Promise<GroupMember> => {
    const response = await api.post<GroupMember>(`/api/v1/groups/${groupId}/join`);
    return response.data.data;
  },

  // Leave group
  leaveGroup: async (groupId: string): Promise<void> => {
    await api.post(`/api/v1/groups/${groupId}/leave`);
  },

  // Invite member to group
  inviteMember: async (groupId: string, inviteData: InviteMemberRequest): Promise<void> => {
    await api.post(`/api/v1/groups/${groupId}/invite`, inviteData);
  },

  // Remove member from group
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    await api.delete(`/api/v1/groups/${groupId}/members/${userId}`);
  },

  // Get group members
  getGroupMembers: async (groupId: string): Promise<GroupMember[]> => {
    const response = await api.get<GroupMember[]>(`/api/v1/groups/${groupId}/members`);
    return response.data.data;
  },

  // Get group progress
  getGroupProgress: async (groupId: string): Promise<GroupProgress> => {
    const response = await api.get<GroupProgress>(`/api/v1/groups/${groupId}/progress`);
    return response.data.data;
  },

  // Get group leaderboard
  getGroupLeaderboard: async (groupId: string): Promise<GroupMember[]> => {
    const response = await api.get<GroupMember[]>(`/api/v1/groups/${groupId}/leaderboard`);
    return response.data.data;
  },

  // Search groups
  searchGroups: async (query: string, limit: number = 10): Promise<Group[]> => {
    const response = await api.get<Group[]>('/api/v1/groups/search', { 
      q: query, 
      limit 
    });
    return response.data.data;
  },

  // Get user's group statistics
  getUserGroupStats: async (): Promise<{
    total_groups: number;
    active_groups: number;
    total_hours_logged: number;
    current_period_hours: number;
  }> => {
    const response = await api.get('/api/v1/groups/stats');
    return response.data.data;
  },
};
