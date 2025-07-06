'use client';

import { useEffect, useState } from 'react';
import { useUserCache } from '../../hooks/useUserCache';

interface UserNameProps {
  userId: string | null | undefined;
  fallback?: string;
  className?: string;
}

export default function UserName({ 
  userId, 
  fallback = 'Non disponible', 
  className = '' 
}: UserNameProps) {
  const { getUserDetails, isLoading, getError } = useUserCache();
  const [displayName, setDisplayName] = useState<string>(fallback);

  useEffect(() => {
    if (!userId) {
      setDisplayName(fallback);
      return;
    }

    const loadUserDetails = async () => {
      try {
        const userDetails = await getUserDetails(userId);
        if (userDetails) {
          const fullName = `${userDetails.givenName} ${userDetails.familyName}`.trim();
          setDisplayName(fullName || userDetails.email || fallback);
        } else {
          setDisplayName(fallback);
        }
      } catch (error) {
        console.error('Erreur lors du chargement du nom utilisateur:', error);
        setDisplayName(fallback);
      }
    };

    loadUserDetails();
  }, [userId, getUserDetails, fallback]);

  if (!userId) {
    return <span className={className}>{fallback}</span>;
  }

  if (isLoading(userId)) {
    return (
      <span className={className}>
        <span className="inline-flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Chargement...
        </span>
      </span>
    );
  }

  const error = getError(userId);
  if (error) {
    return <span className={className}>{fallback}</span>;
  }

  return <span className={className}>{displayName}</span>;
}
