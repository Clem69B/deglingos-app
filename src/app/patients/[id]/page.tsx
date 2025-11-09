'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { uploadData, list, getUrl, remove } from 'aws-amplify/storage'; // Added storage imports
import type { PatientDetail, ConsultationSummary, InvoiceSummary } from '../../../types';
import EditableField from '../../../components/EditableField';
import ProtectedLink from '../../../components/ProtectedLink';
import Link from 'next/link'; // Ajout de l'importation
import { useDirtyForm } from '../../../contexts/DirtyFormContext';
import ErrorAlert from '../../../components/ErrorAlert';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import UnpaidInvoices from '@/components/invoices/UnpaidInvoices';
import usePatientManagement from '@/hooks/usePatientManagement';
import UserAvatar from '@/components/UserAvatar';

const client = generateClient<Schema>();
const PATIENT_DETAIL_PAGE_DIRTY_SOURCE = 'patientDetailPage';

// Types pour AWS Amplify Storage
interface StorageListResultItem {
  path: string;
  lastModified?: Date;
  size?: number;
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const { error, errorType, setError, clearError, handleAmplifyResponse } = useErrorHandler();
  
  // Use patient management hook
  const { 
    patient, 
    loading: patientLoading, 
    getPatientById,
    updateField: updatePatientField 
  } = usePatientManagement({ onError: setError });
  
  const [consultations, setConsultations] = useState<ConsultationSummary[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // État pour la suppression

  // State for attachments
  const [attachments, setAttachments] = useState<StorageListResultItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(true);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);


  // Dirty state management
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
        clearError();

        // Use the hook to fetch patient
        await getPatientById(patientId);

        // Load consultations
        const consultationsResponse = await client.models.Consultation.list({
          filter: { patientId: { eq: patientId } },
        });
        const consultationsData = handleAmplifyResponse(consultationsResponse);
        if (consultationsData) {
          const sortedConsultations = consultationsData.sort(
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
        const unpaidInvoicesData = handleAmplifyResponse(invoicesResponse);
        if (unpaidInvoicesData) {
          setUnpaidInvoices(unpaidInvoicesData as InvoiceSummary[]);
        }

      } catch (err) {
        console.error('Error loading patient data:', err);
        setError(err instanceof Error ? err : new Error('Erreur lors du chargement des données du patient.'));
      } finally {
        setLoading(false);
      }
    };

    const fetchPatientAttachments = async () => {
      if (!patientId) return;
      setAttachmentsLoading(true);
      setAttachmentError(null);
      try {
        const result = await list({
          path: `patient_attachments/${patientId}/`,
        });
        setAttachments(result.items);
      } catch (err) {
        console.error('Error listing attachments:', err);
        setAttachmentError('Erreur lors du chargement des pièces jointes.');
      } finally {
        setAttachmentsLoading(false);
      }
    };

    if (patientId) {
      loadPatientData();
      fetchPatientAttachments();
    }
  }, [patientId, router, clearError, handleAmplifyResponse, setError, getPatientById]); // Added getPatientById dependency

  // Wrapper for updatePatientField to match EditableField's expected signature
  const handleUpdatePatientField = async (entityId: string, fieldName: string, newValue: string | number | boolean | null | undefined): Promise<void> => {
    await updatePatientField(entityId, fieldName, newValue);
  };

  const handleDeletePatient = async () => {
    if (!patient) return;

    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer ${patient.firstName} ${patient.lastName} ? Cette action supprimera également toutes les consultations et factures associées.`
    );

    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    clearError();

    try {
      // 1. Récupérer les consultations associées
      const consultationsResponse = await client.models.Consultation.list({
        filter: { patientId: { eq: patientId } },
      });
      const consultationsToDelete = handleAmplifyResponse(consultationsResponse);

      if (consultationsToDelete) {
        // 2. Supprimer les consultations
        const deleteConsultationPromises = consultationsToDelete.map(c => client.models.Consultation.delete({ id: c.id }));
        const deleteConsultationsResults = await Promise.allSettled(deleteConsultationPromises);
        deleteConsultationsResults.forEach(result => {
          if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.errors)) {
            // handleAmplifyResponse gère les erreurs pour les opérations individuelles si nécessaire
            // Pour l'instant, on loggue et on continue, ou on pourrait accumuler les erreurs
            console.error("Erreur lors de la suppression d'une consultation:", result.status === 'rejected' ? result.reason : result.value.errors);
            // On pourrait lancer une erreur ici pour arrêter le processus si une suppression échoue
          }
        });
      }

      // 3. Récupérer les factures associées
      const invoicesResponse = await client.models.Invoice.list({
        filter: { patientId: { eq: patientId } },
      });
      const invoicesToDelete = handleAmplifyResponse(invoicesResponse);

      if (invoicesToDelete) {
        // 4. Supprimer les factures
        const deleteInvoicePromises = invoicesToDelete.map(i => client.models.Invoice.delete({ id: i.id }));
        const deleteInvoicesResults = await Promise.allSettled(deleteInvoicePromises);
        deleteInvoicesResults.forEach(result => {
          if (result.status === 'rejected' || (result.status === 'fulfilled' && result.value.errors)) {
            console.error("Erreur lors de la suppression d'une facture:", result.status === 'rejected' ? result.reason : result.value.errors);
          }
        });
      }

      // 5. Supprimer le patient
      const deletePatientResponse = await client.models.Patient.delete({ id: patientId });
      if (!handleAmplifyResponse(deletePatientResponse)) {
        // L'erreur est déjà définie par handleAmplifyResponse
        throw new Error("Échec de la suppression du patient.");
      }

      // Redirection après succès
      router.push('/patients?deleted=true'); // Vous pouvez gérer ce paramètre sur la page des patients pour un message
    } catch (err) {
      console.error('Erreur lors de la suppression du patient et de ses données associées:', err);
      // setError est appelé par handleAmplifyResponse ou ici si ce n'est pas une erreur Amplify
      if (!(err instanceof Error && (err.message.includes("Amplify") || error))) {
        const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression.';
        setError(errorMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchPatientAttachments = useCallback(async () => {
    if (!patientId) return;
    setAttachmentsLoading(true);
    setAttachmentError(null);
    try {
      const result = await list({
        path: `patient_attachments/${patientId}/`,
      });
      setAttachments(result.items);
    } catch (err) {
      console.error('Error listing attachments:', err);
      setAttachmentError('Erreur lors du chargement des pièces jointes.');
    } finally {
      setAttachmentsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (patientId) {
      fetchPatientAttachments();
    }
  }, [patientId, fetchPatientAttachments]);


  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAttachmentError(null);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !patientId) {
      setAttachmentError("Veuillez sélectionner un fichier.");
      return;
    }
    setIsUploading(true);
    setAttachmentError(null);
    try {
      const result = await uploadData({
        path: `patient_attachments/${patientId}/${selectedFile.name}`,
        data: selectedFile,
        options: {
          onProgress: ({ transferredBytes, totalBytes }) => {
            if (totalBytes) {
              console.log(
                `Upload Progress: ${Math.round(
                  (transferredBytes / totalBytes) * 100
                )} %`
              );
            }
          },
        }
      }).result;
      console.log('Succeeded upload: ', result);
      setSelectedFile(null); // Reset file input
      // Clear the file input visually
      const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      await fetchPatientAttachments(); // Refresh the list
    } catch (err) {
      console.error('Error uploading file:', err);
      setAttachmentError(`Erreur lors de l'envoi du fichier: ${ (err as Error).message || 'Vérifiez la console pour plus de détails.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDownload = async (path: string) => {
    try {
      const getUrlResult = await getUrl({ path });
      window.open(getUrlResult.url.toString(), '_blank');
    } catch (err) {
      console.error('Error getting file URL:', err);
      setAttachmentError('Erreur lors de la récupération du lien de téléchargement.');
    }
  };

  const handleFileDelete = async (path: string) => {
    const confirmDelete = window.confirm("Êtes-vous sûr de vouloir supprimer cette pièce jointe ?");
    if (!confirmDelete) return;

    setAttachmentError(null);
    try {
      await remove({ path });
      await fetchPatientAttachments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting file:', err);
      setAttachmentError('Erreur lors de la suppression du fichier.');
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

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <UserAvatar 
            firstName={patient.firstName}
            lastName={patient.lastName}
            size="lg"
          />
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
            isDirty={isPageDirty || isDeleting} // Utiliser l'état global du contexte et désactiver si suppression en cours
            disabled={isDeleting}
          >
            Retour
          </ProtectedLink>
          <button
            type="button"
            onClick={handleDeletePatient}
            disabled={isDeleting || isPageDirty}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                        ${isDeleting || isPageDirty ? 'bg-red-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'}`}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Suppression...
              </>
            ) : (
              'Supprimer Patient'
            )}
          </button>
          {/* Les boutons Modifier/Annuler/Enregistrer globaux sont supprimés */}
        </div>
      </div>

      {/* Affichage des erreurs global */}
      <ErrorAlert
        error={error}
        type={errorType}
        title="Notification"
        onClose={clearError}
        dismissible={true}
        className="my-4"
      />

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
                updateFunction={handleUpdatePatientField}
                required
                validationRules={(val) => (!val || String(val).trim() === '' ? 'Le prénom est obligatoire' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Nom"
                fieldName="lastName"
                value={patient.lastName}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
                required
                validationRules={(val) => (!val || String(val).trim() === '' ? 'Le nom est obligatoire' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="E-mail"
                fieldName="email"
                value={patient.email}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
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
                updateFunction={handleUpdatePatientField}
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
                updateFunction={handleUpdatePatientField}
                inputType="date"
                validationRules={(val) => (val && new Date(String(val)) > new Date() ? 'Date future invalide' : null)}
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Genre"
                fieldName="gender"
                value={patient.gender}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
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
                updateFunction={handleUpdatePatientField}
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
                updateFunction={handleUpdatePatientField}
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
                  updateFunction={handleUpdatePatientField}
                  placeholder="Paris"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Code postal"
                  fieldName="postalCode"
                  value={patient.postalCode}
                  entityId={patientId}
                  updateFunction={handleUpdatePatientField}
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
                fieldName="referringPhysician"
                value={patient.referringPhysician}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
                placeholder="Dr. Nom Prénom"
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Antécédents médicaux"
                fieldName="medicalHistory"
                value={patient.medicalHistory}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
                inputType="textarea"
                placeholder="Maladies, allergies, etc."
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Antécédents chirurgicaux"
                fieldName="surgicalHistory"
                value={patient.surgicalHistory}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
                inputType="textarea"
                placeholder="Opérations, interventions, etc."
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Traitement en cours"
                fieldName="currentMedications"
                value={patient.currentMedications}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
                inputType="textarea"
                placeholder="Nom du médicament, dosage, fréquence"
                onDirtyStateChange={handleDirtyStateChange}
              />
              <EditableField
                label="Activités et mode de vie"
                fieldName="activities"
                value={patient.activities}
                entityId={patientId}
                updateFunction={handleUpdatePatientField}
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
              <Link
                href={`/consultations/new?patientId=${patientId}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Nouvelle consultation
              </Link>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Planifier RDV
              </button>
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Créer facture
              </button>
            </div>
          </div>

          {/* Unpaid Invoices */}
          <UnpaidInvoices invoices={unpaidInvoices} formatDate={formatDate} />

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

      {/* Attachments Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pièces jointes</h3>
        {attachmentError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {attachmentError}
          </div>
        )}
        <div className="mb-4 space-y-2 sm:space-y-0 sm:flex sm:space-x-2">
          <input
            id="attachment-upload"
            type="file"
            onChange={handleFileSelected}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-md file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100
                       sm:flex-grow"
          />
          <button
            onClick={handleFileUpload}
            disabled={!selectedFile || isUploading}
            className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white 
                        ${(!selectedFile || isUploading) ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi...
              </>
            ) : (
              'Ajouter le fichier'
            )}
          </button>
        </div>

        {attachmentsLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement des pièces jointes...</p>
          </div>
        ) : attachments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {attachments.map((attachment) => (
              <li key={attachment.path} className="py-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate" title={attachment.path.split('/').pop()}>
                    {attachment.path.split('/').pop()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {attachment.lastModified && formatDateTime(attachment.lastModified.toISOString())}
                    {attachment.size && ` - ${formatFileSize(attachment.size)}`}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0 space-x-2">
                  <button
                    onClick={() => handleFileDownload(attachment.path)}
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    Télécharger
                  </button>
                  <button
                    onClick={() => handleFileDelete(attachment.path)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">Aucune pièce jointe pour ce patient.</p>
        )}
      </div>
    </div>
  );
}
