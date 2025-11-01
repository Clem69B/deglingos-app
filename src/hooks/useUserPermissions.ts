'use client';

import { useAuthenticator } from '@aws-amplify/ui-react';
import { useUserCache } from './useUserCache';
import { useEffect, useState } from 'react';

export const useUserPermissions = () => {
  const { user } = useAuthenticator((context) => [context.user]);
  const { getUserDetails } = useUserCache();
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserGroups = async () => {
      if (!user?.userId) {
        setUserGroups([]);
        setLoading(false);
        return;
      }

      try {
        const userDetails = await getUserDetails(user.userId);        
        if (userDetails?.groups) {
          setUserGroups(userDetails.groups);
        } else {
          setUserGroups([]);
        }
      } catch (error) {
        console.error('❌ Error fetching user:', error);
        setUserGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserGroups();
  }, [user?.userId, getUserDetails]);

  const hasGroup = (groupName: string): boolean => {
    return userGroups.includes(groupName);
  };

  const hasAnyGroup = (groupNames: string[]): boolean => {
    return groupNames.some(group => userGroups.includes(group));
  };

  const isAdmin = hasGroup('admins');
  const isOsteopath = hasGroup('osteopaths');
  const isAssistant = hasGroup('assistants');

  const canManageUsers = isAdmin;
  const canViewUsers = hasAnyGroup(['osteopaths', 'assistants', 'admins']);

  return {
    userGroups,
    loading,
    hasGroup,
    hasAnyGroup,
    isAdmin,
    isOsteopath,
    isAssistant,
    canManageUsers,
    canViewUsers,
  };
};
