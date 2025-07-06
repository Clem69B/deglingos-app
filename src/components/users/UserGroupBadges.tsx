'use client';

import { useState } from 'react';

interface UserGroupBadgesProps {
  groups: string[];
  userId?: string;
  canManage?: boolean;
  onGroupChange?: (userId: string, groupName: string, action: 'add' | 'remove') => Promise<void>;
  className?: string;
}

const groupConfig = {
  admins: {
    label: 'Admin',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-200',
  },
  osteopaths: {
    label: 'Ostéopathe',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
  },
  assistants: {
    label: 'Assistant',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
  },
} as const;

const availableGroups = ['admins', 'osteopaths', 'assistants'];

export default function UserGroupBadges({ 
  groups, 
  userId, 
  canManage = false, 
  onGroupChange,
  className = '' 
}: UserGroupBadgesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggleGroup = async (groupName: string) => {
    if (!userId || !onGroupChange || loading) return;

    const action = groups.includes(groupName) ? 'remove' : 'add';
    setLoading(groupName);

    try {
      await onGroupChange(userId, groupName, action);
    } catch (error) {
      console.error('Error toggling group:', error);
    } finally {
      setLoading(null);
    }
  };

  if (isEditing && canManage) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex flex-wrap gap-1">
          {availableGroups.map((groupName) => {
            const config = groupConfig[groupName as keyof typeof groupConfig];
            const isSelected = groups.includes(groupName);
            const isLoading = loading === groupName;

            return (
              <button
                key={groupName}
                onClick={() => handleToggleGroup(groupName)}
                disabled={isLoading}
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium border transition-colors
                  ${isSelected 
                    ? `${config.bgColor} ${config.textColor} ${config.borderColor}` 
                    : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-sm'}
                `}
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className={`mr-1 ${isSelected ? '✓' : '+'}`}>
                    {isSelected ? '✓' : '+'}
                  </span>
                )}
                {config.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-green-600 hover:text-green-800"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex flex-wrap gap-1">
        {groups.length > 0 ? (
          groups.map((groupName) => {
            const config = groupConfig[groupName as keyof typeof groupConfig] || {
              label: groupName,
              bgColor: 'bg-gray-100',
              textColor: 'text-gray-800',
              borderColor: 'border-gray-200',
            };

            return (
              <span
                key={groupName}
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor}`}
              >
                {config.label}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-gray-500 italic">Aucun groupe</span>
        )}
      </div>
      
      {canManage && userId && onGroupChange && (
        <button
          onClick={() => setIsEditing(true)}
          className="ml-1 text-xs text-indigo-600 hover:text-indigo-800"
          title="Modifier les groupes"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  );
}
