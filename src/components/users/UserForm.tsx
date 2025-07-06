'use client';

import React, { useState } from 'react';
import { useUserManagement } from '../../hooks/useUserManagement';

interface UserFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  isOpen: boolean;
}

const availableGroups = [
  { id: 'assistants', label: 'Assistant', description: 'Accès limité aux fonctionnalités de base' },
  { id: 'osteopaths', label: 'Ostéopathe', description: 'Accès complet aux consultations et patients' },
  { id: 'admins', label: 'Administrateur', description: 'Accès total et gestion des utilisateurs' },
];

export default function UserForm({ onSuccess, onCancel, isOpen }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    givenName: '',
    familyName: '',
    phoneNumber: '',
    groups: ['assistants'] as string[],
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { createUser, loading, error, clearError } = useUserManagement();

  // Reset form when opened
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        givenName: '',
        familyName: '',
        phoneNumber: '',
        groups: ['assistants'],
      });
      setValidationErrors({});
      clearError();
    }
  }, [isOpen, clearError]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Format d\'email invalide';
    }

    if (!formData.givenName.trim()) {
      errors.givenName = 'Le prénom est requis';
    }

    if (!formData.familyName.trim()) {
      errors.familyName = 'Le nom est requis';
    }

    if (formData.phoneNumber && !/^[+]?[\d\s\-\(\)]+$/.test(formData.phoneNumber)) {
      errors.phoneNumber = 'Format de téléphone invalide';
    }

    if (formData.groups.length === 0) {
      errors.groups = 'Au moins un groupe doit être sélectionné';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      console.log('🔄 Submitting user form:', formData);
      await createUser(formData);
      console.log('✅ User created successfully');
      onSuccess?.();
    } catch (err) {
      console.error('❌ Error creating user:', err);
      // Error is handled by useUserManagement hook
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData(prev => ({
      ...prev,
      groups: prev.groups.includes(groupId)
        ? prev.groups.filter(g => g !== groupId)
        : [...prev.groups, groupId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Ajouter un utilisateur
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="utilisateur@exemple.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="givenName" className="block text-sm font-medium text-gray-700">
                  Prénom *
                </label>
                <input
                  type="text"
                  id="givenName"
                  value={formData.givenName}
                  onChange={(e) => setFormData(prev => ({ ...prev, givenName: e.target.value }))}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.givenName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.givenName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.givenName}</p>
                )}
              </div>

              <div>
                <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                  Nom *
                </label>
                <input
                  type="text"
                  id="familyName"
                  value={formData.familyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, familyName: e.target.value }))}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.familyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.familyName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.familyName}</p>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+33 1 23 45 67 89"
              />
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>

            {/* Groups */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Groupes d&apos;utilisateur *
              </label>
              <div className="space-y-3">
                {availableGroups.map((group) => (
                  <div key={group.id} className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id={group.id}
                        type="checkbox"
                        checked={formData.groups.includes(group.id)}
                        onChange={() => handleGroupToggle(group.id)}
                        className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor={group.id} className="font-medium text-gray-700 cursor-pointer">
                        {group.label}
                      </label>
                      <p className="text-gray-500">{group.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {validationErrors.groups && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.groups}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Création...
                  </div>
                ) : (
                  "Créer l'utilisateur"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
