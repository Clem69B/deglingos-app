'use client';

import { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import type { CreatePatientInput, PatientFormData } from '../../../types/patient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AutoResizeTextarea from '../../../components/AutoResizeTextarea'; // Importer le nouveau composant

const client = generateClient<Schema>();

export default function NewPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<PatientFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    postalCode: '',
    gender: '',
    profession: '',
    referingPhysician: '',
    medicalHistory: '',
    chirgicalHistory: '',
    currentMedications: '',
    activities: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Veuillez saisir une adresse email valide';
    }
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = 'Veuillez saisir un numéro de téléphone valide';
    }
    if (formData.dateOfBirth && new Date(formData.dateOfBirth) > new Date()) {
      newErrors.dateOfBirth = 'La date de naissance ne peut pas être dans le futur';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const patientData: CreatePatientInput = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      // Only include optional fields if they have values
      if (formData.email.trim()) patientData.email = formData.email.trim();
      if (formData.phone.trim()) patientData.phone = formData.phone.trim();
      if (formData.dateOfBirth) patientData.dateOfBirth = formData.dateOfBirth;
      if (formData.address.trim()) patientData.address = formData.address.trim();
      if (formData.city.trim()) patientData.city = formData.city.trim();
      if (formData.postalCode.trim()) patientData.postalCode = formData.postalCode.trim();
      if (formData.gender) patientData.gender = formData.gender;
      if (formData.profession.trim()) patientData.profession = formData.profession.trim();
      if (formData.referingPhysician.trim()) patientData.referingPhysician = formData.referingPhysician.trim();
      if (formData.medicalHistory.trim()) patientData.medicalHistory = formData.medicalHistory.trim();
      if (formData.chirgicalHistory.trim()) patientData.chirgicalHistory = formData.chirgicalHistory.trim();
      if (formData.currentMedications.trim()) patientData.currentMedications = formData.currentMedications.trim();
      if (formData.activities.trim()) patientData.activities = formData.activities.trim();

      const response = await client.models.Patient.create(patientData);
      
      if (response.data) {
        router.push('/patients');
      } else {
        console.error('Error creating patient:', response.errors);
        setErrors({ general: 'Une erreur est survenue lors de la création du patient' });
      }
    } catch (error) {
      console.error('Error creating patient:', error);
      setErrors({ general: 'Une erreur est survenue lors de la création du patient' });
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
            Nouveau Patient
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Ajouter un nouveau patient à votre cabinet
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/patients"
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
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{errors.general}</div>
              </div>
            )}

            {/* Personal Information Section */}
            <div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Informations personnelles</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Détails personnels et coordonnées du patient.
                  </p>
                </div>
                <div className="mt-5 md:col-span-2 md:mt-0">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.firstName ? 'border-red-300' : ''
                        }`}
                        placeholder="Saisissez le prénom"
                      />
                      {errors.firstName && (
                        <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Nom *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.lastName ? 'border-red-300' : ''
                        }`}
                        placeholder="Saisissez le nom"
                      />
                      {errors.lastName && (
                        <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        E-mail
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.email ? 'border-red-300' : ''
                        }`}
                        placeholder="patient@exemple.com"
                      />
                      {errors.email && (
                        <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.phone ? 'border-red-300' : ''
                        }`}
                        placeholder="+33 1 23 45 67 89"
                      />
                      {errors.phone && (
                        <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        id="dateOfBirth"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                          errors.dateOfBirth ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.dateOfBirth && (
                        <p className="mt-2 text-sm text-red-600">{errors.dateOfBirth}</p>
                      )}
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Genre
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      >
                        <option value="">Sélectionner le genre</option>
                        <option value="M">Homme</option>
                        <option value="F">Femme</option>
                        <option value="OTHER">Autre</option>
                      </select>
                    </div>
                    
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="profession" className="block text-sm font-medium text-gray-700">
                        Profession
                      </label>
                      <input
                        type="text"
                        id="profession"
                        name="profession"
                        value={formData.profession}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Profession du patient"
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

            {/* Address Information Section */}
            <div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Adresse</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Coordonnées postales du patient.
                  </p>
                </div>
                <div className="mt-5 md:col-span-2 md:mt-0">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6">
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Adresse
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="123 rue Principale"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        Ville
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Paris"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                        Code postal
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="75001"
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

            {/* Medical Information Section */}
            <div>
              <div className="md:grid md:grid-cols-3 md:gap-6">
                <div className="md:col-span-1">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Informations médicales</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Antécédents, traitements et autres informations médicales pertinentes.
                  </p>
                </div>
                <div className="mt-5 md:col-span-2 md:mt-0">
                  <div className="grid grid-cols-6 gap-6">
                    <div className="col-span-6 sm:col-span-3">
                      <label htmlFor="referingPhysician" className="block text-sm font-medium text-gray-700">
                        Médecin traitant
                      </label>
                      <input
                        type="text"
                        id="referingPhysician"
                        name="referingPhysician"
                        value={formData.referingPhysician}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Dr. Nom du médecin traitant"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="medicalHistory" className="block text-sm font-medium text-gray-700">
                        Antécédents médicaux
                      </label>
                      <AutoResizeTextarea
                        id="medicalHistory"
                        name="medicalHistory"
                        rows={3}
                        value={formData.medicalHistory}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Maladies, pathologies antérieures, etc."
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="chirgicalHistory" className="block text-sm font-medium text-gray-700">
                        Antécédents chirurgicaux
                      </label>
                      <AutoResizeTextarea
                        id="chirgicalHistory"
                        name="chirgicalHistory"
                        rows={3}
                        value={formData.chirgicalHistory}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Opérations, interventions chirurgicales, etc."
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="currentMedications" className="block text-sm font-medium text-gray-700">
                        Médicaments en cours
                      </label>
                      <AutoResizeTextarea
                        id="currentMedications"
                        name="currentMedications"
                        rows={2}
                        value={formData.currentMedications}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Médicaments et dosages actuels"
                      />
                    </div>

                    <div className="col-span-6">
                      <label htmlFor="activities" className="block text-sm font-medium text-gray-700">
                        Activités et mode de vie
                      </label>
                      <AutoResizeTextarea
                        id="activities"
                        name="activities"
                        rows={2}
                        value={formData.activities}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Activités sportives, profession physique, habitudes de vie, etc."
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
                'Créer le patient'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
