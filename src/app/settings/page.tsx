'use client';

import { useState, useEffect } from 'react';
import TeamManagement from '../../components/TeamManagement';
import SignatureUpload from '../../components/SignatureUpload';
import { useUserProfile } from '../../hooks/useUserProfile';
import type { UserProfile, UserProfileFormData } from '../../types/user-profile';
import { fetchAuthSession } from 'aws-amplify/auth';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfileFormData>({
    professionalTitle: '',
    postalAddress: '',
    siret: '',
    rpps: '',
    defaultConsultationPrice: '',
    invoiceFooter: '',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    fetchCurrentUserProfile,
    updateProfile,
    loading,
    error,
    validationErrors,
    clearError,
  } = useUserProfile();

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const session = await fetchAuthSession();
        const currentUserId = session.tokens?.accessToken?.payload?.sub as string;
        setUserId(currentUserId);

        const userProfile = await fetchCurrentUserProfile();
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            professionalTitle: userProfile.professionalTitle || '',
            postalAddress: userProfile.postalAddress || '',
            siret: userProfile.siret || '',
            rpps: userProfile.rpps || '',
            defaultConsultationPrice: userProfile.defaultConsultationPrice?.toString() || '',
            invoiceFooter: userProfile.invoiceFooter || '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      }
    };

    loadProfile();
  }, [fetchCurrentUserProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
    setSaveSuccess(false);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;

    const success = await updateProfile(userId, formData);
    if (success) {
      setSaveSuccess(true);
      // Reload profile
      const updatedProfile = await fetchCurrentUserProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    }
  };

  const handleSignatureUpload = async () => {
    // Reload profile to get updated signature
    const updatedProfile = await fetchCurrentUserProfile();
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
  };

  const handleSignatureDelete = async () => {
    // Reload profile
    const updatedProfile = await fetchCurrentUserProfile();
    if (updatedProfile) {
      setProfile(updatedProfile);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profil professionnel', icon: UserCircleIcon },
    { id: 'team', name: 'Équipe', icon: UsersIcon },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <div className="border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configurez votre application et vos préférences.
            </p>
          </div>
          
          {/* Tabs */}
          <div className="px-6">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center
                    ${activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profil professionnel</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Vos informations professionnelles pour les factures et documents.
                </p>
              </div>

              {/* Success message */}
              {saveSuccess && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Profil enregistré avec succès
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error messages */}
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <XCircleIcon className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="rounded-md bg-yellow-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Erreurs de validation:</h3>
                      <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                        {validationErrors.map((err, idx) => (
                          <li key={idx}>{err.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Professional Title */}
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
                    placeholder="Ex: Ostéopathe D.O."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* SIRET */}
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
                    placeholder="12345678901234"
                    maxLength={14}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">14 chiffres</p>
                </div>

                {/* RPPS */}
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
                    placeholder="12345678901"
                    maxLength={11}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">11 chiffres</p>
                </div>

                {/* Postal Address */}
                <div className="sm:col-span-2">
                  <label htmlFor="postalAddress" className="block text-sm font-medium text-gray-700">
                    Adresse professionnelle
                  </label>
                  <textarea
                    id="postalAddress"
                    name="postalAddress"
                    rows={3}
                    value={formData.postalAddress}
                    onChange={handleInputChange}
                    placeholder="Adresse complète du cabinet..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Default Consultation Price */}
                <div>
                  <label htmlFor="defaultConsultationPrice" className="block text-sm font-medium text-gray-700">
                    Tarif consultation standard
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="number"
                      id="defaultConsultationPrice"
                      name="defaultConsultationPrice"
                      value={formData.defaultConsultationPrice}
                      onChange={handleInputChange}
                      placeholder="80"
                      step="0.01"
                      min="0"
                      className="block w-full pr-12 border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">€</span>
                    </div>
                  </div>
                </div>

                {/* Invoice Footer */}
                <div className="sm:col-span-2">
                  <label htmlFor="invoiceFooter" className="block text-sm font-medium text-gray-700">
                    Pied de page des factures
                  </label>
                  <textarea
                    id="invoiceFooter"
                    name="invoiceFooter"
                    rows={2}
                    value={formData.invoiceFooter}
                    onChange={handleInputChange}
                    placeholder="Texte personnalisé pour le pied de page de vos factures..."
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Signature Upload */}
              {userId && (
                <div className="pt-6 border-t border-gray-200">
                  <SignatureUpload
                    userId={userId}
                    currentSignatureKey={profile?.signatureS3Key}
                    onUploadSuccess={handleSignatureUpload}
                    onDeleteSuccess={handleSignatureDelete}
                  />
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'team' && <TeamManagement />}
        </div>
      </div>
    </div>
  );
}

// Icon components conservés uniquement pour les onglets nécessaires et les messages
function UsersIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

function UserCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

function CheckCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function XCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ExclamationTriangleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}
