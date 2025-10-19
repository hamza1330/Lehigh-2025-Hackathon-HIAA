import { useState, useEffect, useCallback } from 'react';
import { groupsService, Group, GroupDetail, CreateGroupRequest, UpdateGroupRequest } from '../services/groups';

// Custom hook for managing groups
export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all groups
  const fetchGroups = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const groupsData = await groupsService.getGroups();
      setGroups(groupsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create new group
  const createGroup = useCallback(async (groupData: CreateGroupRequest) => {
    try {
      const newGroup = await groupsService.createGroup(groupData);
      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      throw err;
    }
  }, []);

  // Update group
  const updateGroup = useCallback(async (groupId: string, groupData: UpdateGroupRequest) => {
    try {
      const updatedGroup = await groupsService.updateGroup(groupId, groupData);
      setGroups(prev => prev.map(group => 
        group.id === groupId ? updatedGroup : group
      ));
      return updatedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  }, []);

  // Delete group
  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      await groupsService.deleteGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete group');
      throw err;
    }
  }, []);

  // Join group
  const joinGroup = useCallback(async (groupId: string) => {
    try {
      await groupsService.joinGroup(groupId);
      // Refresh groups to get updated data
      await fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join group');
      throw err;
    }
  }, [fetchGroups]);

  // Leave group
  const leaveGroup = useCallback(async (groupId: string) => {
    try {
      await groupsService.leaveGroup(groupId);
      setGroups(prev => prev.filter(group => group.id !== groupId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to leave group');
      throw err;
    }
  }, []);

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    isLoading,
    error,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    joinGroup,
    leaveGroup,
  };
};

// Custom hook for managing a single group
export const useGroup = (groupId: string) => {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch group details
  const fetchGroup = useCallback(async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const groupData = await groupsService.getGroupById(groupId);
      setGroup(groupData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch group');
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Update group
  const updateGroup = useCallback(async (groupData: UpdateGroupRequest) => {
    if (!groupId) return;
    
    try {
      const updatedGroup = await groupsService.updateGroup(groupId, groupData);
      setGroup(prev => prev ? { ...prev, ...updatedGroup } : null);
      return updatedGroup;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update group');
      throw err;
    }
  }, [groupId]);

  // Invite member
  const inviteMember = useCallback(async (username: string) => {
    if (!groupId) return;
    
    try {
      await groupsService.inviteMember(groupId, { username });
      // Refresh group to get updated member list
      await fetchGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
      throw err;
    }
  }, [groupId, fetchGroup]);

  // Remove member
  const removeMember = useCallback(async (userId: string) => {
    if (!groupId) return;
    
    try {
      await groupsService.removeMember(groupId, userId);
      // Refresh group to get updated member list
      await fetchGroup();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      throw err;
    }
  }, [groupId, fetchGroup]);

  // Load group on mount
  useEffect(() => {
    fetchGroup();
  }, [fetchGroup]);

  return {
    group,
    isLoading,
    error,
    fetchGroup,
    updateGroup,
    inviteMember,
    removeMember,
  };
};
