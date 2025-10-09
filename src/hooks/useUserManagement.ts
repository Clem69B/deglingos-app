'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

interface UserDetails {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  phoneNumber: string;
  enabled: boolean;
  userStatus: string;
  groups: string[];
  createdDate: string;
  lastModifiedDate: string;
}

interface UserList {
  users: UserDetails[];
  nextToken?: string;
  totalCount?: number;
}

interface CreateUserParams {
  email: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string;
  groups?: string[];
}

export const useUserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const listUsers = useCallback(async (limit?: number, nextToken?: string): Promise<UserList | null> => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Calling listUsers with:', { limit, nextToken });
      const response = await client.queries.listUsers({ 
        limit: limit || 20, 
        nextToken 
      });

      if (response.data) {
        console.log('✅ Users list received:', response.data);
        return response.data as UserList;
      } else {
        throw new Error('No data received');
      }
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (params: CreateUserParams) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Creating user:', params);
      const response = await client.mutations.createUser({
        email: params.email,
        givenName: params.givenName,
        familyName: params.familyName,
        phoneNumber: params.phoneNumber || '',
        groups: params.groups || ['assistants']
      });

      if (response.data) {
        console.log('✅ User created:', response.data);
        return response.data;
      } else {
        throw new Error('Error creating user');
      }
    } catch (err) {
      console.error('❌ Error creating user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error creating user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Deleting user:', userId);
      const response = await client.mutations.deleteUser({ userId });

      if (response.data) {
        console.log('✅ User deleted:', response.data);
        return response.data;
      } else {
        throw new Error('Error deleting user');
      }
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error deleting user';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const addUserToGroup = useCallback(async (userId: string, groupName: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Adding user to group:', { userId, groupName });
      const response = await client.mutations.manageUserGroups({ action: 'add', userId, groupName });

      if (response.data) {
        console.log('✅ User added to group:', response.data);
        return response.data;
      } else {
        throw new Error('Error adding user to group');
      }
    } catch (err) {
      console.error('❌ Error adding user to group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error adding user to group';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeUserFromGroup = useCallback(async (userId: string, groupName: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Removing user from group:', { userId, groupName });
      const response = await client.mutations.manageUserGroups({ action: 'remove', userId, groupName });

      if (response.data) {
        console.log('✅ User removed from group:', response.data);
        return response.data;
      } else {
        throw new Error('Error removing user from group');
      }
    } catch (err) {
      console.error('❌ Error removing user from group:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error removing user from group';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    clearError,
    listUsers,
    createUser,
    deleteUser,
    addUserToGroup,
    removeUserFromGroup,
  };
};
