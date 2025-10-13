import { useState, useEffect, useCallback } from 'react';
import { fetchUserAttributes, updateUserAttributes, getCurrentUser } from 'aws-amplify/auth';
import type { UserProfile } from '../types/userProfile';

/**
 * Hook to fetch and update current user's Cognito profile attributes
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  /**
   * Fetch user profile from Cognito
   */
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First check if user is authenticated
      await getCurrentUser();

      // Fetch user attributes
      const attributes = await fetchUserAttributes();

      // Map Cognito attributes to our UserProfile interface
      const userProfile: UserProfile = {
        givenName: attributes.given_name,
        familyName: attributes.family_name,
        email: attributes.email,
        phoneNumber: attributes.phone_number,
        professionalTitle: attributes['custom:professionalTitle'],
        postalAddress: attributes['custom:postalAddress'],
        siret: attributes['custom:siret'],
        rpps: attributes['custom:rpps'],
        defaultConsultationPrice: attributes['custom:defaultConsultationPrice'],
        invoiceFooter: attributes['custom:invoiceFooter'],
      };

      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update user profile attributes in Cognito
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<void> => {
    try {
      setUpdating(true);
      setError(null);

      // Map our UserProfile interface to Cognito attribute names
      const attributeUpdates: Record<string, string> = {};

      if (updates.givenName !== undefined) attributeUpdates.given_name = updates.givenName;
      if (updates.familyName !== undefined) attributeUpdates.family_name = updates.familyName;
      if (updates.email !== undefined) attributeUpdates.email = updates.email;
      if (updates.phoneNumber !== undefined) attributeUpdates.phone_number = updates.phoneNumber;
      if (updates.professionalTitle !== undefined) attributeUpdates['custom:professionalTitle'] = updates.professionalTitle;
      if (updates.postalAddress !== undefined) attributeUpdates['custom:postalAddress'] = updates.postalAddress;
      if (updates.siret !== undefined) attributeUpdates['custom:siret'] = updates.siret;
      if (updates.rpps !== undefined) attributeUpdates['custom:rpps'] = updates.rpps;
      if (updates.defaultConsultationPrice !== undefined) attributeUpdates['custom:defaultConsultationPrice'] = updates.defaultConsultationPrice;
      if (updates.invoiceFooter !== undefined) attributeUpdates['custom:invoiceFooter'] = updates.invoiceFooter;

      // Update attributes in Cognito
      await updateUserAttributes({
        userAttributes: attributeUpdates,
      });

      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      console.error('Error updating user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUpdating(false);
    }
  }, [fetchProfile]);

  /**
   * Update a single field
   */
  const updateField = useCallback(async (fieldName: keyof UserProfile, value: string): Promise<void> => {
    await updateProfile({ [fieldName]: value });
  }, [updateProfile]);

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updating,
    updateProfile,
    updateField,
    refreshProfile: fetchProfile,
  };
}
