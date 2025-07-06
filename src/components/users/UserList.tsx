'use client';

import { useState, useEffect } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';
import { useUserCache } from '../../hooks/useUserCache';
import { UserName } from './';
import UserStatusBadge from './UserStatusBadge';
import UserGroupBadges from './UserGroupBadges';

interface User {
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

interface UserListProps {
  canManageUsers: boolean;
  onRefresh?: () => void;
}

export default function UserList({ canManageUsers, onRefresh }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);

  const { 
    listUsers, 
    deleteUser, 
    addUserToGroup, 
    removeUserFromGroup, 
    loading: managementLoading 
  } = useUserManagement();
  const { clearCache } = useUserCache();

  // Load users function (must be declared before useEffect)
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      setError(null);
      console.log('🔄 Loading users list...');
      
      const result = await listUsers(50); // Load up to 50 users
      if (result?.users) {
        console.log('✅ Users loaded:', result.users.length);
        setUsers(result.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('❌ Error loading users:', err);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?\n\nCette action est irréversible.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingUser(userId);
      console.log('🔄 Deleting user:', userId);
      
      await deleteUser(userId);
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.userId !== userId));
      
      // Clear cache to ensure fresh data
      clearCache();
      
      console.log('✅ User deleted successfully');
      onRefresh?.();
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      setError('Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setDeletingUser(null);
    }
  };

  const handleGroupChange = async (userId: string, groupName: string, action: 'add' | 'remove') => {
    try {
      console.log(`🔄 ${action === 'add' ? 'Adding' : 'Removing'} user ${userId} ${action === 'add' ? 'to' : 'from'} group ${groupName}`);
      
      if (action === 'add') {
        await addUserToGroup(userId, groupName);
      } else {
        await removeUserFromGroup(userId, groupName);
      }

      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.userId === userId) {
          const newGroups = action === 'add' 
            ? [...user.groups, groupName]
            : user.groups.filter(g => g !== groupName);
          return { ...user, groups: newGroups };
        }
        return user;
      }));

      // Clear cache to ensure fresh data
      clearCache();
      
      console.log('✅ Group change successful');
    } catch (err) {
      console.error('❌ Error changing user group:', err);
      setError(`Erreur lors de la modification du groupe`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loadingUsers) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Chargement des utilisateurs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <div className="mt-3">
              <button
                onClick={loadUsers}
                className="text-sm bg-red-100 text-red-800 rounded px-2 py-1 hover:bg-red-200"
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur</h3>
        <p className="mt-1 text-sm text-gray-500">
          Aucun utilisateur n&apos;a été trouvé dans le système.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Utilisateurs ({users.length})
          </h3>
          <button
            onClick={loadUsers}
            disabled={loadingUsers}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Groupes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Créé le
                </th>
                {canManageUsers && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.givenName?.[0]}{user.familyName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          <UserName userId={user.userId} fallback={`${user.givenName} ${user.familyName}`} />
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <UserStatusBadge status={user.userStatus} />
                  </td>
                  <td className="px-6 py-4">
                    <UserGroupBadges
                      groups={user.groups}
                      userId={user.userId}
                      canManage={canManageUsers}
                      onGroupChange={handleGroupChange}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdDate)}
                  </td>
                  {canManageUsers && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.userId, user.email)}
                        disabled={deletingUser === user.userId || managementLoading}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deletingUser === user.userId ? (
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          'Supprimer'
                        )}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
