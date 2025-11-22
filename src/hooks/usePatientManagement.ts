'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/../amplify/data/resource';
import type { PatientDetail, CreatePatientInput, UpdatePatientInput } from '@/types/patient';

const client = generateClient<Schema>();

interface UsePatientManagementOptions {
  onError: (error: string) => void;
}

const usePatientManagement = ({ onError }: UsePatientManagementOptions) => {
  const [patients, setPatients] = useState<PatientDetail[]>([]);
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizeError = (err: unknown): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'Unknown error';
    if (Array.isArray(err) && err.every(e => e && typeof e === 'object' && 'message' in e && typeof ((e as Record<string, unknown>).message) === 'string')) {
      return (err as Array<{ message: string }>).map(e => e.message).join(' | ');
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  };

  const handleError = useCallback((err: unknown) => {
    const message = normalizeError(err);
    onError(message);
    return message;
  }, [onError]);

  const listPatients = useCallback(async (filter?: { lastName?: string; limit?: number }) => {
    setLoading(true);
    onError('');
    try {
      const graphQLFilter = filter?.lastName
        ? {
          or: [
            { lastName: { contains: filter.lastName } },
            { lastName: { contains: filter.lastName.charAt(0).toUpperCase() + filter.lastName.slice(1).toLowerCase() } },
          ],
        }
        : undefined;

      const { data, errors } = await client.models.Patient.list({
        filter: graphQLFilter,
        selectionSet: [
          'id', 'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
          'createdAt', 'updatedAt'
        ],
        limit: filter?.limit || 100,
      });
      if (errors) throw errors;
      setPatients(data as unknown as PatientDetail[]);
    } catch (err) {
      handleError(err);
      console.error('Failed to list patients:', err);
    } finally {
      setLoading(false);
    }
  }, [onError, handleError]);

  const getPatientById = useCallback(async (id: string) => {
    setLoading(true);
    onError('');
    try {
      const { data, errors } = await client.models.Patient.get({ id });
      if (errors) throw errors;
      if (!data) throw new Error('Patient not found.');

      setPatient(data as PatientDetail);
      return data as PatientDetail;
    } catch (err) {
      handleError(err);
      console.error(`Failed to fetch patient with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError, handleError]);

  const createPatient = async (input: CreatePatientInput): Promise<PatientDetail | null> => {
    setLoading(true);
    onError('');
    try {
      const { data, errors } = await client.models.Patient.create(input);
      if (errors) throw errors;
      if (!data) return null;

      return data as PatientDetail;
    } catch (err) {
      handleError(err);
      console.error('Failed to create patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePatient = async (input: UpdatePatientInput): Promise<PatientDetail | null> => {
    setLoading(true);
    onError('');
    try {
      const { data, errors } = await client.models.Patient.update(input);
      if (errors) throw errors;
      if (!data) return null;

      const updatedPatient = data as PatientDetail;
      updateLocalCaches(updatedPatient);
      return updatedPatient;
    } catch (err) {
      handleError(err);
      console.error('Failed to update patient:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    setLoading(true);
    onError('');
    try {
      const { data, errors } = await client.models.Patient.delete({ id });
      if (errors) throw errors;
      if (!data) return false;

      // Remove from local caches
      setPatients(prev => prev.filter(p => p.id !== id));
      if (patient?.id === id) {
        setPatient(null);
      }
      return true;
    } catch (err) {
      handleError(err);
      console.error('Failed to delete patient:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const setLocalPatient = (updatedPatient: PatientDetail | null) => {
    setPatient(updatedPatient);
  };

  // Sync single-patient and patients list
  const updateLocalCaches = (updated: PatientDetail) => {
    setPatient(updated);
    setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  // Generic field update with optimistic UI
  const updateField = async (id: string, fieldName: string, value: unknown): Promise<PatientDetail | null> => {
    // Ensure the patient is loaded
    let currentPatient = patient;
    if (!currentPatient || currentPatient.id !== id) {
      currentPatient = await getPatientById(id);
    }
    if (!currentPatient) throw new Error('Patient not loaded');

    const oldPatient = { ...currentPatient };
    const updatedPatient: PatientDetail = {
      ...currentPatient,
      [fieldName]: value,
    };

    // Optimistic update
    updateLocalCaches(updatedPatient);

    try {
      let processedValue = value;

      // Trim string values
      if (typeof value === 'string') {
        processedValue = value.trim();
      }

      // Set empty optional fields to null
      const optionalFields = [
        'email', 'phone', 'dateOfBirth', 'address', 'city', 'postalCode',
        'gender', 'profession', 'referringPhysician', 'medicalHistory',
        'surgicalHistory', 'currentMedications', 'activities'
      ];

      if (processedValue === '' && optionalFields.includes(fieldName)) {
        processedValue = null;
      }

      const updateInput: UpdatePatientInput = {
        id,
        [fieldName]: processedValue,
      };

      const result = await updatePatient(updateInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
      return result;
    } catch (err) {
      // Revert on failure
      updateLocalCaches(oldPatient);
      handleError(err);
      throw err;
    }
  };

  return {
    patients,
    patient,
    loading,
    listPatients,
    getPatientById,
    createPatient,
    updatePatient,
    updateField,
    deletePatient,
    setLocalPatient,
  };
};

export default usePatientManagement;
