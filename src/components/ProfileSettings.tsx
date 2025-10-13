'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';
import ErrorAlert from './ErrorAlert';
import { validateProfileField } from '../lib/validators';
import type { ProfileValidationErrors } from '../types/userProfile';

export default function ProfileSettings() {
  const { profile, loading, error: profileError, updateField, updating } = useUserProfile();
  const [formData, setFormData] = useState({
    givenName: '',
    familyName: '',
    email: '',
    phoneNumber: '',
    professionalTitle: '',
    postalAddress: '',
    siret: '',
    rpps: '',
    defaultConsultationPrice: '',
    invoiceFooter: '',
  });
  const [validationErrors, setValidationErrors] = useState<ProfileValidationErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setFormData({
        givenName: profile.givenName || '',
        familyName: profile.familyName || '',
        email: profile.email || '',
        phoneNumber: profile.phoneNumber || '',
        professionalTitle: profile.professionalTitle || '',
        postalAddress: profile.postalAddress || '',
        siret: profile.siret || '',
        rpps: profile.rpps || '',
        defaultConsultationPrice: profile.defaultConsultationPrice || '',
        invoiceFooter: profile.invoiceFooter || '',
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error for this field
    if (validationErrors[name as keyof ProfileValidationErrors]) {
      setValidationErrors((prev: ProfileValidationErrors) => ({ ...prev, [name]: undefined }));
    }
    
    // Clear success message on any change
    if (saveSuccess) {
      setSaveSuccess(null);
    }
  };

  const handleFieldBlur = async (fieldName: keyof typeof formData) => {
    const value = formData[fieldName];
    
    // Validate field
    const error = validateProfileField(fieldName, value);
    if (error) {
      setValidationErrors((prev: ProfileValidationErrors) => ({ ...prev, [fieldName]: error }));
      return;
    }

    // Check if value changed from profile
    const currentValue = profile?.[fieldName] || '';
    if (value === currentValue) {
      return; // No change, don't update
    }

    // Update field in Cognito
    try {
      setSaveError(null);
      await updateField(fieldName, value);
      setSaveSuccess(`${getFieldLabel(fieldName)} mis à jour`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    }
  };

  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      givenName: 'Prénom',
      familyName: 'Nom',
      email: 'Email',
      phoneNumber: 'Téléphone',
      professionalTitle: 'Titre professionnel',
      postalAddress: 'Adresse postale',
      siret: 'SIRET',
      rpps: 'RPPS',
      defaultConsultationPrice: 'Tarif de consultation',
      invoiceFooter: 'Pied de page des factures',
    };
    return labels[fieldName] || fieldName;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Chargement du profil...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Profil professionnel</h3>
        <p className="mt-1 text-sm text-gray-600">
          Gérez vos informations personnelles et professionnelles. Tous les champs sont optionnels.
        </p>
      </div>

      {profileError && (
        <ErrorAlert error={profileError} title="Erreur de chargement" />
      )}

      {saveError && (
        <ErrorAlert error={saveError} title="Erreur de sauvegarde" autoClose autoCloseDelay={5000} />
      )}

      {saveSuccess && (
        <ErrorAlert 
          error={saveSuccess} 
          type="info" 
          autoClose 
          autoCloseDelay={3000}
          dismissible={false}
        />
      )}

      <form className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Informations personnelles</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="givenName" className="block text-sm font-medium text-gray-700">
                Prénom
              </label>
              <input
                type="text"
                id="givenName"
                name="givenName"
                value={formData.givenName}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('givenName')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.givenName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Jean"
              />
              {validationErrors.givenName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.givenName}</p>
              )}
            </div>

            <div>
              <label htmlFor="familyName" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                type="text"
                id="familyName"
                name="familyName"
                value={formData.familyName}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('familyName')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.familyName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Dupont"
              />
              {validationErrors.familyName && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.familyName}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('email')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="jean.dupont@example.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Téléphone
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('phoneNumber')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="+33 1 23 45 67 89"
              />
              {validationErrors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Informations professionnelles</h4>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="professionalTitle" className="block text-sm font-medium text-gray-700">
                Titre professionnel
              </label>
              <input
                type="text"
                id="professionalTitle"
                name="professionalTitle"
                value={formData.professionalTitle}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('professionalTitle')}
                disabled={updating}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ostéopathe D.O."
              />
            </div>

            <div>
              <label htmlFor="siret" className="block text-sm font-medium text-gray-700">
                SIRET
              </label>
              <input
                type="text"
                id="siret"
                name="siret"
                value={formData.siret}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('siret')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.siret ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345678901234"
              />
              {validationErrors.siret && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.siret}</p>
              )}
            </div>

            <div>
              <label htmlFor="rpps" className="block text-sm font-medium text-gray-700">
                RPPS
              </label>
              <input
                type="text"
                id="rpps"
                name="rpps"
                value={formData.rpps}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('rpps')}
                disabled={updating}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                  validationErrors.rpps ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="12345678901"
              />
              {validationErrors.rpps && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.rpps}</p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700">
                Adresse postale
              </label>
              <textarea
                id="postalAddress"
                name="postalAddress"
                rows={3}
                value={formData.postalAddress}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('postalAddress')}
                disabled={updating}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="1 rue de la Paix&#10;75001 Paris"
              />
            </div>
          </div>
        </div>

        {/* Billing Information Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Paramètres de facturation</h4>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="defaultConsultationPrice" className="block text-sm font-medium text-gray-700">
                Tarif de consultation par défaut
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="text"
                  id="defaultConsultationPrice"
                  name="defaultConsultationPrice"
                  value={formData.defaultConsultationPrice}
                  onChange={handleInputChange}
                  onBlur={() => handleFieldBlur('defaultConsultationPrice')}
                  disabled={updating}
                  className={`block w-full pr-12 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                    validationErrors.defaultConsultationPrice ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="80"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">€</span>
                </div>
              </div>
              {validationErrors.defaultConsultationPrice && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.defaultConsultationPrice}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Ce tarif pourra être utilisé pour pré-remplir les nouvelles consultations
              </p>
            </div>

            <div>
              <label htmlFor="invoiceFooter" className="block text-sm font-medium text-gray-700">
                Pied de page des factures
              </label>
              <textarea
                id="invoiceFooter"
                name="invoiceFooter"
                rows={3}
                value={formData.invoiceFooter}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('invoiceFooter')}
                disabled={updating}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Informations complémentaires à afficher en bas des factures..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Ces informations apparaîtront sur vos factures (disponible prochainement)
              </p>
            </div>
          </div>
        </div>
      </form>

      {updating && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">Enregistrement...</span>
        </div>
      )}
    </div>
  );
}
