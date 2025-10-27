'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';
import type { UserProfile, UserProfileFormData, ValidationError } from '../types/user-profile';

const client = generateClient<Schema>();

// Validation helpers
export const validateSIRET = (siret: string): boolean => {
  return /^\d{14}$/.test(siret.replace(/\s/g, ''));
};

export const validateRPPS = (rpps: string): boolean => {
  return /^\d{11}$/.test(rpps.replace(/\s/g, ''));
};

export const validatePhone = (phone: string): boolean => {
  // French phone format: +33... or 0...
  const cleaned = phone.replace(/[\s.-]/g, '');
  return /^(\+33|0)[1-9]\d{8}$/.test(cleaned);
};

export const validateConsultationPrice = (price: string): boolean => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

export const useUserProfile = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const clearError = useCallback(() => {
    setError(null);
    setValidationErrors([]);
  }, []);

  // Fetch current user's profile
  const fetchCurrentUserProfile = useCallback(async (): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);

      const session = await fetchAuthSession();
      const userId = session.tokens?.accessToken?.payload?.sub as string;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const response = await client.models.UserProfile.get({ userId });

      if (response.data) {
        console.log('✅ UserProfile fetched:', response.data);
        return response.data as UserProfile;
      }

      return null;
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error fetching profile';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch any user's profile (admin/osteopath only)
  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      setLoading(true);
      setError(null);

      const response = await client.models.UserProfile.get({ userId });

      if (response.data) {
        console.log('✅ UserProfile fetched:', response.data);
        return response.data as UserProfile;
      }

      return null;
    } catch (err) {
      console.error('❌ Error fetching user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error fetching profile';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate profile data
  const validateProfileData = useCallback((data: Partial<UserProfileFormData>): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (data.siret && data.siret.trim() && !validateSIRET(data.siret)) {
      errors.push({ field: 'siret', message: 'Le SIRET doit contenir exactement 14 chiffres' });
    }

    if (data.rpps && data.rpps.trim() && !validateRPPS(data.rpps)) {
      errors.push({ field: 'rpps', message: 'Le RPPS doit contenir exactement 11 chiffres' });
    }

    if (data.defaultConsultationPrice && data.defaultConsultationPrice.trim()) {
      if (!validateConsultationPrice(data.defaultConsultationPrice)) {
        errors.push({ field: 'defaultConsultationPrice', message: 'Le prix doit être un nombre valide' });
      }
    }

    return errors;
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (
    userId: string,
    data: Partial<UserProfileFormData>
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      setValidationErrors([]);

      // Validate data
      const errors = validateProfileData(data);
      if (errors.length > 0) {
        setValidationErrors(errors);
        return false;
      }

      // Prepare update data
      type UpdateData = {
        professionalTitle?: string | null;
        postalAddress?: string | null;
        siret?: string | null;
        rpps?: string | null;
        invoiceFooter?: string | null;
        defaultConsultationPrice?: number;
      };

      const updateData: UpdateData = {};
      if (data.professionalTitle !== undefined) updateData.professionalTitle = data.professionalTitle || null;
      if (data.postalAddress !== undefined) updateData.postalAddress = data.postalAddress || null;
      if (data.siret !== undefined) updateData.siret = data.siret || null;
      if (data.rpps !== undefined) updateData.rpps = data.rpps || null;
      if (data.invoiceFooter !== undefined) updateData.invoiceFooter = data.invoiceFooter || null;
      
      if (data.defaultConsultationPrice !== undefined && data.defaultConsultationPrice.trim()) {
        updateData.defaultConsultationPrice = parseFloat(data.defaultConsultationPrice);
      }

      const response = await client.models.UserProfile.update({
        userId,
        ...updateData,
      });

      if (response.data) {
        console.log('✅ UserProfile updated:', response.data);
        return true;
      }

      throw new Error('Failed to update profile');
    } catch (err) {
      console.error('❌ Error updating user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error updating profile';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateProfileData]);

  // Upload signature
  const uploadSignature = useCallback(async (
    userId: string,
    file: File
  ): Promise<{ success: boolean; key?: string; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Validate file type
      if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
        const errorMsg = 'Le fichier doit être au format JPG';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Validate file size (1MB max)
      if (file.size > 1024 * 1024) {
        const errorMsg = 'Le fichier ne doit pas dépasser 1 MB';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Upload to S3
      const key = `user_signatures/${userId}/${Date.now()}_${file.name}`;
      const result = await uploadData({
        path: key,
        data: file,
        options: {
          contentType: file.type,
        },
      }).result;

      console.log('✅ Signature uploaded:', result);

      // Update profile with new signature key
      await client.models.UserProfile.update({
        userId,
        signatureS3Key: key,
      });

      return { success: true, key };
    } catch (err) {
      console.error('❌ Error uploading signature:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error uploading signature';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete signature
  const deleteSignature = useCallback(async (
    userId: string,
    signatureKey: string
  ): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      // Remove from S3
      await remove({ path: signatureKey });

      // Update profile to remove signature key
      await client.models.UserProfile.update({
        userId,
        signatureS3Key: null,
      });

      console.log('✅ Signature deleted');
      return true;
    } catch (err) {
      console.error('❌ Error deleting signature:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error deleting signature';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get signature URL
  const getSignatureUrl = useCallback(async (signatureKey: string): Promise<string | null> => {
    try {
      const result = await getUrl({ path: signatureKey });
      return result.url.toString();
    } catch (err) {
      console.error('❌ Error getting signature URL:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    validationErrors,
    clearError,
    fetchCurrentUserProfile,
    fetchUserProfile,
    updateProfile,
    uploadSignature,
    deleteSignature,
    getSignatureUrl,
    validateProfileData,
  };
};
