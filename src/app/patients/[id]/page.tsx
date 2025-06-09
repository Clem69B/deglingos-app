'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import type { PatientDetail, ConsultationSummary, InvoiceSummary } from '../../../types';
import EditableField from '../../../components/EditableField';
import ProtectedLink from '../../../components/ProtectedLink';
import Link from 'next/link';
import { useDirtyForm } from '../../../contexts/DirtyFormContext';

const client = generateClient<Schema>();
const PATIENT_DETAIL_PAGE_DIRTY_SOURCE = 'patientDetailPage';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Dirty state management
  const [dirtyFields, setDirtyFields] = useState<Set<string>>(new Set()); 
  const { isPageDirty, addDirtySource, removeDirtySource } = useDirtyForm(); // Récupérer isPageDirty


  // Nouvelle gestion dirty: chaque champ a sa propre sourceId, plus besoin de dirtyFields local
  const handleDirtyStateChange = useCallback(
    (fieldName: string, isDirty: boolean) => {
      const sourceId = `${PATIENT_DETAIL_PAGE_DIRTY_SOURCE}:${fieldName}`;
      if (isDirty) {
        addDirtySource(sourceId);
      } else {
        removeDirtySource(sourceId);
      }
    },
    [addDirtySource, removeDirtySource]
  );

  useEffect(() => {
    // Remove dirty source when the component unmounts
    return () => {
      removeDirtySource(PATIENT_DETAIL_PAGE_DIRTY_SOURCE);
    };
  }, [removeDirtySource]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPageDirty) { // Utiliser l'état global du contexte
        event.preventDefault();
        event.returnValue = 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPageDirty]); // Dépend de l'état global du contexte

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true);
        setGeneralError(null);

        const patientResponse = await client.models.Patient.get({ id: patientId });
        if (!patientResponse.data) {
          router.push('/patients');
          return;
        }
        const patientData = patientResponse.data as PatientDetail;
        setPatient(patientData);

        // Load consultations
        const consultationsResponse = await client.models.Consultation.list({
          filter: { patientId: { eq: patientId } },
        });
        if (consultationsResponse.data) {
          const sortedConsultations = consultationsResponse.data.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          ) as ConsultationSummary[];
          setConsultations(sortedConsultations);
        }

        // Load unpaid invoices
        const invoicesResponse = await client.models.Invoice.list({
          filter: {
            patientId: { eq: patientId },
            status: { ne: 'PAID' }
          },
        });
        if (invoicesResponse.data) {
          setUnpaidInvoices(invoicesResponse.data as InvoiceSummary[]);
        }

      } catch (error) {
        console.error('Error loading patient data:', error);
        setGeneralError('Erreur lors du chargement des données du patient.');
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      loadPatientData();
    }
  }, [patientId, router]);

  // handleInputChange, validateForm, handleSave, handleCancel sont supprimés

  const updatePatientField = async (entityId: string, fieldName: string, newValue: any) => {
    if (!patient) return;

    const oldPatientData = { ...patient };
    // @ts-ignore
    setPatient(prev => prev ? { ...prev, [fieldName]: newValue } : null);
    setGeneralError(null);

    try {
      const updateData: { id: string;[key: string]: any } = {
        id: entityId,
      };

      let processedValue = newValue;
      if (typeof newValue === 'string') {
        processedValue = newValue.trim();
      }
      // Pour les champs optionnels, si la valeur après trim est vide, la mettre à null
      if (processedValue === '' && ['email', 'phone', 'dateOfBirth', 'address', 'city', 'postalCode', 'gender', 'profession', 'referingPhysician', 'medicalHistory', 'chirgicalHistory', 'currentMedications', 'activities'].includes(fieldName)) {
        processedValue = null;
      }

      updateData[fieldName] = processedValue;

      const response = await client.models.Patient.update(updateData);

      if (response.errors || !response.data) {
        console.error('Error updating patient field:', response.errors);
        setPatient(oldPatientData);
        const errorMessage = `Erreur lors de la mise à jour du champ '${fieldName}'.`;
        setGeneralError(errorMessage);
        throw new Error(errorMessage);
      }
      setPatient(response.data as PatientDetail);
      // Après une sauvegarde réussie, le champ n'est plus dirty. EditableField s'en chargera via son useEffect.
    } catch (error) {
      console.error(`Error in updatePatientField for ${fieldName}:`, error);
      setPatient(oldPatientData);
      const errorMessage = error instanceof Error ? error.message : `Une erreur est survenue lors de la mise à jour du champ '${fieldName}'.`;
      setGeneralError(errorMessage);
      throw new Error(errorMessage); // Rethrow pour que EditableField puisse le catcher
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return ''; // EditableField gère "Non renseigné"
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateAge = (birthDate: string | null | undefined) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  const getPatientInitials = (firstName: string | null | undefined, lastName: string | null | undefined) => {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Patient non trouvé</h3>
        <p className="mt-1 text-sm text-gray-500">
          Le patient que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <div className="mt-6">
          <Link
            href="/patients"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Retour à la liste des patients
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0 flex items-center space-x-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-medium">
            {getPatientInitials(patient.firstName, patient.lastName)}
          </div>
          <div>
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {patient.firstName} {patient.lastName}
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
              {patient.dateOfBirth && (
                <p className="text-sm text-gray-500">
                  {calculateAge(patient.dateOfBirth)} ans
                </p>
              )}
              {patient.email && (
                <p className="text-sm text-gray-500">{patient.email}</p>
              )}
              {patient.phone && (
                <p className="text-sm text-gray-500">{patient.phone}</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          {/* Unpaid invoices indicator */}
          {unpaidInvoices.length > 0 && (
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {unpaidInvoices.length} facture{unpaidInvoices.length > 1 ? 's' : ''} impayée{unpaidInvoices.length > 1 ? 's' : ''}
            </div>
          )}

          <ProtectedLink
            href="/patients"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            isDirty={isPageDirty} // Utiliser l'état global du contexte
          >
            Retour
          </ProtectedLink>
          {/* Les boutons Modifier/Annuler/Enregistrer globaux sont supprimés */}
        </div>
      </div>



      {/* General Error Message */}
      {generalError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Patient Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <EditableField
                label="Prénom"
                fieldName="firstName"
                value={patient.firstName}
                entityId={patientId}
                updateFunction={updatePatientField}
                required
                validationRules={(val) => (!val || String(val).trim() === '' ? 'Le prénom est obligatoire' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Nom"
                fieldName="lastName"
                value={patient.lastName}
                entityId={patientId}
                updateFunction={updatePatientField}
                required
                validationRules={(val) => (!val || String(val).trim() === '' ? 'Le nom est obligatoire' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="E-mail"
                fieldName="email"
                value={patient.email}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="email"
                placeholder="exemple@domaine.com"
                validationRules={(val) => (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val)) ? 'Email invalide' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Téléphone"
                fieldName="phone"
                value={patient.phone}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="tel"
                placeholder="0612345678"
                validationRules={(val) => (val && !/^[\d\s\-\+\(\)]+$/.test(String(val)) ? 'Téléphone invalide' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Date de naissance"
                fieldName="dateOfBirth"
                value={patient.dateOfBirth}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="date"
                validationRules={(val) => (val && new Date(String(val)) > new Date() ? 'Date future invalide' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Genre"
                fieldName="gender"
                value={patient.gender}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="select"
                placeholder="Sélectionner..."
                options={[
                  { value: '', label: 'Non spécifié' },
                  { value: 'M', label: 'Homme' },
                  { value: 'F', label: 'Femme' },
                  { value: 'OTHER', label: 'Autre' },
                ]}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Profession"
                fieldName="profession"
                value={patient.profession}
                entityId={patientId}
                updateFunction={updatePatientField}
                placeholder="Profession du patient"
                onDirtyStateChange={handleDirtyStateChange}
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
            <div className="space-y-4">
              <EditableField
                label="Adresse"
                fieldName="address"
                value={patient.address}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="textarea"
                placeholder="1 rue de la Paix"
                onDirtyStateChange={handleDirtyStateChange}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <EditableField
                  label="Ville"
                  fieldName="city"
                  value={patient.city}
                  entityId={patientId}
                  updateFunction={updatePatientField}
                  placeholder="Paris"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Code postal"
                  fieldName="postalCode"
                  value={patient.postalCode}
                  entityId={patientId}
                  updateFunction={updatePatientField}
                  placeholder="75001"
                  onDirtyStateChange={handleDirtyStateChange}
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informations médicales</h3>
            <div className="space-y-6">
              <EditableField
                label="Médecin traitant"
                fieldName="referingPhysician"
                value={patient.referingPhysician}
                entityId={patientId}
                updateFunction={updatePatientField}
                placeholder="Dr. Nom Prénom"
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Antécédents médicaux"
                fieldName="medicalHistory"
                value={patient.medicalHistory}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="textarea"
                placeholder="Maladies, allergies, etc."
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Antécédents chirurgicaux"
                fieldName="chirgicalHistory"
                value={patient.chirgicalHistory}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="textarea"
                placeholder="Opérations, interventions, etc."
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Médicaments en cours"
                fieldName="currentMedications"
                value={patient.currentMedications}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="textarea"
                placeholder="Nom du médicament, dosage, fréquence"
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Activités et mode de vie"
                fieldName="activities"
                value={patient.activities}
                entityId={patientId}
                updateFunction={updatePatientField}
                inputType="textarea"
                placeholder="Sport, travail, habitudes..."
                onDirtyStateChange={handleDirtyStateChange}
              />
            </div>
          </div>
        </div>


        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-3">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                Nouvelle consultation
              </button>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Planifier RDV
              </button>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Créer facture
              </button>
            </div>
          </div>

          {/* Unpaid Invoices */}
          {unpaidInvoices.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Factures impayées</h3>
              <div className="space-y-3">
                {unpaidInvoices.slice(0, 3).map((invoice) => (
                  <div key={invoice.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-red-900">
                          Facture #{invoice.invoiceNumber}
                        </p>
                        <p className="text-xs text-red-700">
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-red-900">
                        {invoice.total}€
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'OVERDUE'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {invoice.status === 'OVERDUE' ? 'En retard' :
                          invoice.status === 'SENT' ? 'Envoyée' :
                            'Brouillon'}
                      </span>
                    </div>
                  </div>
                ))}
                {unpaidInvoices.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    Et {unpaidInvoices.length - 3} autres...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Full Consultations List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Historique des consultations</h3>
            </div>
            <div className="px-6 py-4">
              {consultations.length > 0 ? (
                <ul className="space-y-4">
                  {consultations.map((consultation) => (
                    <li key={consultation.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex justify-between items-start">
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-indigo-600">
                            {formatDateTime(consultation.date)}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Motif:</span>
                            <span 
                              className="ml-1 text-gray-600 truncate inline-block align-bottom max-w-xs" 
                              title={consultation.reason || "Non spécifié"}
                            >
                              {consultation.reason || "Non spécifié"}
                            </span>
                          </p>
                        </div>
                        <Link 
                          href={`/consultations/${consultation.id}`} 
                          className="ml-4 flex-shrink-0 text-sm text-indigo-600 hover:text-indigo-900 hover:underline whitespace-nowrap"
                        >
                          Voir détails
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune consultation</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Ce patient n&apos;a pas encore de consultation enregistrée.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
