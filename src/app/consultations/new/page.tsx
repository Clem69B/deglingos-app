'use client';

import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useRouter, useSearchParams } from 'next/navigation'; // Ajout de useSearchParams
import Link from 'next/link';
import AutoResizeTextarea from '../../../components/AutoResizeTextarea';
import ErrorAlert from '../../../components/ErrorAlert';
import PatientCombobox from '../../../components/PatientCombobox';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useDirtyForm } from '../../../contexts/DirtyFormContext';

const client = generateClient<Schema>();

interface ConsultationFormData {
  patientId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  notes: string;
}

export default function NewConsultationPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Récupérer les searchParams
  const { error, errorType, setError, clearError, handleAmplifyResponse } = useErrorHandler();
  const { addDirtySource, removeDirtySource } = useDirtyForm();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<ConsultationFormData>({
    patientId: '',
    date: '',
    time: '',
    duration: 60,
    reason: '',
    notes: ''
  });

  // Gestion du dirty state
  useEffect(() => {
    if (isDirty) {
      addDirtySource('consultation-form');
    } else {
      removeDirtySource('consultation-form');
    }

    return () => {
      removeDirtySource('consultation-form');
    };
  }, [isDirty, addDirtySource, removeDirtySource]);

  useEffect(() => {
    // Définir la date et l'heure par défaut à maintenant
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);

    // Récupérer patientId depuis l'URL
    const patientIdFromUrl = searchParams.get('patientId');

    setFormData(prev => ({
      ...prev,
      date: today,
      time: currentTime,
      patientId: patientIdFromUrl || '' // Pré-remplir si disponible
    }));
  }, [searchParams]); // Ajouter searchParams aux dépendances

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    clearError();
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' ? parseInt(value) : value
    }));
    setIsDirty(true);
  };

  const handlePatientChange = (patientId: string) => {
    setFormData(prev => ({ ...prev, patientId }));
    clearError();
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!formData.patientId || !formData.date || !formData.time) {
      setError('Veuillez remplir les champs obligatoires: Patient, Date, Heure.', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Combiner date et heure
      const consultationDateTime = new Date(`${formData.date}T${formData.time}`);

      const consultationData = {
        patientId: formData.patientId,
        date: consultationDateTime.toISOString(),
        duration: formData.duration,
        reason: formData.reason,
        notes: formData.notes || undefined,
      };

      const response = await client.models.Consultation.create(consultationData);
      const createdConsultation = handleAmplifyResponse(response);
      
      if (createdConsultation) {
        setIsDirty(false); // Marquer comme propre avant la navigation
        router.push(`/consultations/${createdConsultation.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la création de la consultation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Nouvelle consultation
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enregistrez une nouvelle consultation patient
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/consultations"
            className="mr-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Annuler
          </Link>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="shadow sm:overflow-hidden sm:rounded-md">
          <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
            {/* General Error using ErrorAlert */}
            <ErrorAlert
              error={error}
              type={errorType}
              title="Notification"
              onClose={clearError}
              dismissible={true}
            />

            {/* Informations générales */}
            <div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Informations générales</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Informations de base sur la consultation
                  </p>
                </div>
                <div className="mt-5 md:col-span-2 md:mt-0">
                  <div className="grid grid-cols-6 gap-6">
                    {/* Patient */}
                    <div className="col-span-6">
                      <label className="block text-sm font-medium text-gray-700">
                        Patient *
                      </label>
                      <div className="mt-1">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <PatientCombobox
                              value={formData.patientId}
                              onChange={handlePatientChange}
                              placeholder="Rechercher un patient..."
                            />
                          </div>
                          <Link
                            href="/patients/new"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            title="Créer un nouveau patient"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="ml-1 hidden sm:inline">Nouveau patient</span>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Motif */}
                    <div className="col-span-6">
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                        Motif de consultation
                      </label>
                      <input
                        type="text"
                        id="reason"
                        name="reason"
                        value={formData.reason}
                        onChange={handleInputChange}
                        placeholder="Ex: Douleur cervicale, Mal de dos..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <AutoResizeTextarea
                        id="notes"
                        name="notes"
                        rows={2}
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Notes personnelles, observations..."
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block" aria-hidden="true">
              <div className="py-5">
                <div className="border-t border-gray-200" />
              </div>
            </div>

            {/* Planification */}
            <div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Planification</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Date, heure et durée de la consultation
                  </p>
                </div>
                <div className="mt-5 md:col-span-2 md:mt-0">
                  <div className="grid grid-cols-6 gap-6">
                    {/* Date */}
                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date *
                      </label>
                      <input
                        type="date"
                        id="date"
                        name="date"
                        required
                        value={formData.date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Heure */}
                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="time" className="block text-sm font-medium text-gray-700">
                        Heure *
                      </label>
                      <input
                        type="time"
                        id="time"
                        name="time"
                        required
                        value={formData.time}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>

                    {/* Durée */}
                    <div className="col-span-6 sm:col-span-2">
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                        Durée (minutes)
                      </label>
                      <input
                        type="number"
                        id="duration"
                        name="duration"
                        min="15"
                        max="180"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-gray-50 px-4 py-3 text-right sm:px-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création...
                </>
              ) : (
                'Créer la consultation'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
