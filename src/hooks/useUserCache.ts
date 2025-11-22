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

export const useUserCache = () => {
  const [userCache, setUserCache] = useState<Map<string, UserDetails>>(new Map());
  const [loading, setLoading] = useState<Map<string, boolean>>(new Map());
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  const getUserDetails = useCallback(async (userId: string): Promise<UserDetails | null> => {
    if (!userId) return null;

    // Vérifier le cache
    if (userCache.has(userId)) {
      return userCache.get(userId)!;
    }

    // Vérifier si on est déjà en train de charger cet utilisateur
    if (loading.has(userId) && loading.get(userId)) {
      return null;
    }

    try {
      // Marquer comme en cours de chargement
      setLoading(prev => new Map(prev).set(userId, true));
      setErrors(prev => {
        const newErrors = new Map(prev);
        newErrors.delete(userId);
        return newErrors;
      });

      const response = await client.queries.getUserDetails({ userId });

      if (response.data) {
        const userDetails = response.data as UserDetails;

        // Mettre en cache
        setUserCache(prev => new Map(prev).set(userId, userDetails));

        return userDetails;
      } else {
        throw new Error('Utilisateur non trouvé');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails utilisateur:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setErrors(prev => new Map(prev).set(userId, errorMessage));
      return null;
    } finally {
      // Marquer comme terminé
      setLoading(prev => {
        const newLoading = new Map(prev);
        newLoading.delete(userId);
        return newLoading;
      });
    }
  }, [userCache, loading]);

  const clearCache = useCallback(() => {
    setUserCache(new Map());
    setLoading(new Map());
    setErrors(new Map());
  }, []);

  const isLoading = useCallback((userId: string) => {
    return loading.get(userId) || false;
  }, [loading]);

  const getError = useCallback((userId: string) => {
    return errors.get(userId) || null;
  }, [errors]);

  return {
    getUserDetails,
    clearCache,
    isLoading,
    getError,
    userCache: userCache,
  };
};
