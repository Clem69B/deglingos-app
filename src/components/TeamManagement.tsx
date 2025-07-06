'use client';

import { useState } from 'react';
import { useUserPermissions } from '../hooks/useUserPermissions';
import { UserList, UserForm } from './users';

function UsersIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function PlusIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function InfoIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

export default function TeamManagement() {
  const { canViewUsers, canManageUsers, loading: permissionsLoading } = useUserPermissions();
  const [showUserForm, setShowUserForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUserCreated = () => {
    console.log('✅ User created, refreshing list');
    setShowUserForm(false);
    setRefreshKey(prev => prev + 1); // Force refresh of UserList
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing user list');
    setRefreshKey(prev => prev + 1);
  };

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Chargement des permissions...</span>
      </div>
    );
  }

  if (!canViewUsers) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Accès non autorisé</h3>
        <p className="mt-1 text-sm text-gray-500">
          Vous n&apos;avez pas les permissions nécessaires pour voir cette section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Gestion de l&apos;équipe</h3>
          <p className="mt-1 text-sm text-gray-600">
            Gérez les utilisateurs et leurs permissions dans l&apos;application.
          </p>
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowUserForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Ajouter un utilisateur
          </button>
        )}
      </div>

      {/* User List */}
      <UserList 
        key={refreshKey} 
        canManageUsers={canManageUsers}
        onRefresh={handleRefresh}
      />

      {/* Info sur les permissions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InfoIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Permissions actuelles
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Vous pouvez voir la liste des utilisateurs</li>
                {canManageUsers ? (
                  <>
                    <li>Vous pouvez ajouter de nouveaux utilisateurs</li>
                    <li>Vous pouvez supprimer des utilisateurs</li>
                    <li>Vous pouvez modifier les groupes des utilisateurs</li>
                  </>
                ) : (
                  <li>Seuls les administrateurs peuvent gérer les utilisateurs</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      <UserForm
        isOpen={showUserForm}
        onSuccess={handleUserCreated}
        onCancel={() => setShowUserForm(false)}
      />
    </div>
  );
}
