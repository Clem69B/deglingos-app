'use client';

import { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import type { ConsultationWithPatient } from '../../../types';
import type { PaymentMethod } from '../../../types';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import { useDirtyForm } from '../../../contexts/DirtyFormContext';
import ErrorAlert from '../../../components/ErrorAlert';
import EditableField from '../../../components/EditableField';
import { UserName } from '../../../components/users';
import { translateStatus } from '@/lib/invoiceStatus';

const client = generateClient<Schema>();
const CONSULTATION_DETAIL_PAGE_DIRTY_SOURCE = 'consultationDetailPage';

type AnamnesisPayloadShape = {
  skull?: string | null;
  cervical?: string | null;
  digestive?: string | null;
  cardioThoracic?: string | null;
  gynecological?: string | null;
  sleep?: string | null;
  psychological?: string | null;
};

export default function ConsultationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const consultationId = params.id as string;

  const { error, errorType, setError, clearError, handleAmplifyResponse } = useErrorHandler();
  const [consultation, setConsultation] = useState<ConsultationWithPatient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // État pour la suppression

  // Dirty state management
  const { isPageDirty, addDirtySource, removeDirtySource } = useDirtyForm();

  // Nouvelle gestion dirty: chaque champ a sa propre sourceId
  const handleDirtyStateChange = useCallback(
    (fieldName: string, isDirty: boolean) => {
      const sourceId = `${CONSULTATION_DETAIL_PAGE_DIRTY_SOURCE}:${fieldName}`;
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
      removeDirtySource(CONSULTATION_DETAIL_PAGE_DIRTY_SOURCE);
    };
  }, [removeDirtySource]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isPageDirty) {
        event.preventDefault();
        event.returnValue = 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isPageDirty]);

  const fetchConsultation = useCallback(async (id: string) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await client.models.Consultation.get(
        { id },
        {
          selectionSet: [
            'id', 'date', 'duration', 'reason', 'treatment', 'recommendations', 
            'notes', 'createdAt', 'updatedAt', 'owner',
            'anamnesis.skull', 'anamnesis.cervical', 'anamnesis.digestive', 
            'anamnesis.cardioThoracic', 'anamnesis.gynecological', 
            'anamnesis.sleep', 'anamnesis.psychological',
            'patient.id', 'patient.firstName', 'patient.lastName', 
            'patient.email', 'patient.phone', 'patient.dateOfBirth',
            'patient.medicalHistory', 'patient.surgicalHistory', 'patient.currentTreatment', 'patient.activities',
            'invoice.id', 'invoice.status', 'invoice.paymentMethod'
          ]
        }
      );
      
      const consultationData = handleAmplifyResponse(response);
      if (!consultationData) {
        return;
      }
      
      setConsultation(consultationData as ConsultationWithPatient);
    } catch (err) {
      console.error('Erreur lors du chargement de la consultation:', err);
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des donn\'ees de la consultation.'));
    } finally {
      setLoading(false);
    }
  }, [clearError, handleAmplifyResponse, setError]);

  useEffect(() => {
    if (consultationId) {
      fetchConsultation(consultationId);
    }
  }, [consultationId, fetchConsultation]);

  const updateConsultationField = async (entityId: string, fieldName: string, newValue: string | number | boolean | null | undefined) => {
    if (!consultation) return;
    clearError();

    const oldConsultationData = { ...consultation };
    
    // Mise à jour optimiste de l'état local
    if (fieldName.startsWith('anamnesis.')) {
      const anamnesisField = fieldName.split('.')[1];
      setConsultation(prev => prev ? { 
        ...prev, 
        anamnesis: { 
          ...prev.anamnesis, 
          [anamnesisField]: newValue 
        } 
      } : null);
    } else {
      setConsultation(prev => prev ? { ...prev, [fieldName]: newValue } : null);
    }

    try {
      const updateData: { id: string; [key: string]: string | number | boolean | AnamnesisPayloadShape | null | undefined } = {
        id: entityId,
      };

      let processedValue = newValue;
      if (typeof newValue === 'string') {
        processedValue = newValue.trim();
      }
      
      // Pour les champs optionnels, si la valeur après trim est vide, la mettre à null
      const optionalFields = ['treatment', 'recommendations', 'notes', 'reason']; // Ajout de 'reason'
      
      if (processedValue === '' && (optionalFields.includes(fieldName) || fieldName.startsWith('anamnesis.'))) {
        processedValue = null;
      }

      // Correction pour la gestion de la date
      if (fieldName === 'date' && typeof processedValue === 'string' && processedValue) {
        // processedValue est une chaîne de type "YYYY-MM-DDTHH:mm" (heure locale)
        // Convertir en objet Date, qui l'interprétera comme heure locale
        const localDate = new Date(processedValue);
        // Convertir en chaîne ISO UTC
        processedValue = localDate.toISOString();
      }


      if (fieldName.startsWith('anamnesis.')) {
        const anamnesisField = fieldName.split('.')[1];
        updateData.anamnesis = {
          ...consultation.anamnesis,
          [anamnesisField]: processedValue
        };
      } else {
        updateData[fieldName] = processedValue;
      }

      const response = await client.models.Consultation.update(updateData);
      
      if (!handleAmplifyResponse(response)) {
        if (!error) {
          setError(`Erreur lors de la mise à jour du champ '${fieldName}'.`);
        }
        setConsultation(oldConsultationData);
        throw new Error(`Erreur lors de la mise à jour du champ '${fieldName}'.`);
      }
      
      // Re-fetch data to get the correct shape with relations
      await fetchConsultation(entityId);

    } catch (err) {
      console.error(`Error in updateConsultationField for ${fieldName}:`, err);
      setConsultation(oldConsultationData);
      
      if (!(err instanceof Error && (err.message.includes("Amplify") || error))) {
        const errorMessage = err instanceof Error ? err.message : `Une erreur est survenue lors de la mise à jour du champ '${fieldName}'.`;
        setError(errorMessage, 'error');
      }
      throw err;
    }
  };

  const handleDeleteConsultation = async () => {
    if (!consultation) return;

    const confirmation = window.confirm(
      `Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.`
    );

    if (!confirmation) {
      return;
    }

    setIsDeleting(true);
    clearError();

    try {
      const deleteConsultationResponse = await client.models.Consultation.delete({ id: consultationId });
      if (!handleAmplifyResponse(deleteConsultationResponse)) {
        // handleAmplifyResponse aura déjà appelé setError en cas d'erreur Amplify
        // Si ce n'est pas une erreur Amplify mais que la réponse est fausse, définissez une erreur générique.
        if (!error) {
          setError('Erreur lors de la suppression de la consultation.');
        }
        return; // Ne pas rediriger si la suppression a échoué
      }

      // Redirection après succès
      router.push('/consultations?deleted=true');
    } catch (err) {
      console.error('Erreur lors de la suppression de la consultation:', err);
      // setError est appelé par handleAmplifyResponse ou ici si ce n'est pas une erreur Amplify
      if (!(err instanceof Error && (err.message.includes("Amplify") || error))) {
          const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue lors de la suppression de la consultation.';
          setError(errorMessage, 'error');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const updatePatientField = async (entityId: string, fieldName: string, newValue: string | number | boolean | null | undefined) => {
    if (!consultation || !consultation.patient) return;
    clearError();

    const oldPatientData = { ...consultation.patient };
    
    // Optimistic update of local state
    setConsultation(prev => prev ? { 
      ...prev, 
      patient: prev.patient ? { ...prev.patient, [fieldName]: newValue } : prev.patient 
    } : null);

    try {
      const updateData: { id: string; [key: string]: string | number | boolean | null | undefined } = {
        id: entityId,
      };

      let processedValue = newValue;
      if (typeof newValue === 'string') {
        processedValue = newValue.trim();
      }
      
      // For optional fields, if the value after trim is empty, set it to null
      const optionalFields = ['currentTreatment'];
      
      if (processedValue === '' && optionalFields.includes(fieldName)) {
        processedValue = null;
      }

      updateData[fieldName] = processedValue;

      const response = await client.models.Patient.update(updateData);
      
      if (!handleAmplifyResponse(response)) {
        if (!error) {
          setError(`Erreur lors de la mise à jour du champ '${fieldName}'.`);
        }
        setConsultation(prev => prev ? { ...prev, patient: oldPatientData } : null);
        throw new Error(`Erreur lors de la mise à jour du champ '${fieldName}'.`);
      }
      
      // Re-fetch consultation data to get the correct shape with relations
      await fetchConsultation(consultationId);

    } catch (err) {
      console.error(`Error in updatePatientField for ${fieldName}:`, err);
      setConsultation(prev => prev ? { ...prev, patient: oldPatientData } : null);
      
      if (!(err instanceof Error && (err.message.includes("Amplify") || error))) {
        const errorMessage = err instanceof Error ? err.message : `Une erreur est survenue lors de la mise à jour du champ '${fieldName}'.`;
        setError(errorMessage, 'error');
      }
      throw err;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const translatePaymentMethod = (method: PaymentMethod | null | undefined) => {
    if (!method) return 'N/A';
    const translations: Record<PaymentMethod, string> = {
      CHECK: 'Chèque',
      BANK_TRANSFER: 'Virement',
      CASH: 'Espèces',
      CARD: 'Carte bancaire',
    };
    return translations[method];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!consultation) {
    return (
      <div className="text-center">
        <div className="text-sm text-gray-500">Consultation non trouvée</div>
        <Link
          href="/consultations"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          Retour aux consultations
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Consultation du {formatDate(consultation.date)}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {consultation.patient?.firstName} {consultation.patient?.lastName}
          </p>
        </div>
        <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
          <Link
            href="/consultations"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retour
          </Link>
          <button
            onClick={handleDeleteConsultation}
            disabled={isDeleting}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
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
        {/* Informations de la consultation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations générales */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Informations générales
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <EditableField
                    label="Date et heure"
                    value={consultation.date}
                    fieldName="date"
                    entityId={consultation.id}
                    updateFunction={updateConsultationField}
                    inputType="datetime-local"
                    required={true}
                    onDirtyStateChange={handleDirtyStateChange}
                    displayFormatFunction={(dateStr) => dateStr ? formatDate(dateStr as string) : ''} // Utilisation de formatDate
                  />
                </div>
                <div>
                  <EditableField
                    label="Durée (minutes)"
                    value={consultation.duration}
                    fieldName="duration"
                    entityId={consultation.id}
                    updateFunction={updateConsultationField}
                    inputType="number"
                    placeholder="60"
                    onDirtyStateChange={handleDirtyStateChange}
                  />
                </div>
                <div className="sm:col-span-2">
                  <EditableField
                    label="Motif de consultation"
                    value={consultation.reason}
                    fieldName="reason"
                    entityId={consultation.id}
                    updateFunction={updateConsultationField}
                    inputType="textarea"
                    placeholder="Décrivez le motif de la consultation"
                    onDirtyStateChange={handleDirtyStateChange}
                  />
                  <EditableField
                    label="Notes privées"
                    value={consultation.notes}
                    fieldName="notes"
                    entityId={consultation.id}
                    updateFunction={updateConsultationField}
                    inputType="textarea"
                    placeholder="Notes privées (non visibles par le patient)"
                    onDirtyStateChange={handleDirtyStateChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Anamnèse */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Anamnèse
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Crâne & Cervicale"
                  value={consultation.anamnesis?.skull}
                  fieldName="anamnesis.skull"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations sur le système crânio-cervical"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Système cervical"
                  value={consultation.anamnesis?.cervical}
                  fieldName="anamnesis.cervical"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations sur le système cervical"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Système digestif"
                  value={consultation.anamnesis?.digestive}
                  fieldName="anamnesis.digestive"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations sur le système digestif"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Cardio-thoracique"
                  value={consultation.anamnesis?.cardioThoracic}
                  fieldName="anamnesis.cardioThoracic"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations cardio-thoraciques"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Gynécologique"
                  value={consultation.anamnesis?.gynecological}
                  fieldName="anamnesis.gynecological"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations gynécologiques"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Sommeil"
                  value={consultation.anamnesis?.sleep}
                  fieldName="anamnesis.sleep"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations sur le sommeil"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Psychologique & Émotionnel"
                  value={consultation.anamnesis?.psychological}
                  fieldName="anamnesis.psychological"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Informations psychologiques et émotionnelles"
                  onDirtyStateChange={handleDirtyStateChange}
                />
              </div>
            </div>
          </div>

          {/* Traitement et suivi */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Traitement et suivi
              </h3>
              <div className="space-y-4">
                <EditableField
                  label="Traitement"
                  value={consultation.treatment}
                  fieldName="treatment"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Décrivez le traitement effectué"
                  onDirtyStateChange={handleDirtyStateChange}
                />
                <EditableField
                  label="Recommandations"
                  value={consultation.recommendations}
                  fieldName="recommendations"
                  entityId={consultation.id}
                  updateFunction={updateConsultationField}
                  inputType="textarea"
                  placeholder="Recommandations pour le patient"
                  onDirtyStateChange={handleDirtyStateChange}
                />

              </div>
            </div>
          </div>
        </div>

        {/* Sidebar avec informations du patient */}
        <div className="space-y-6">
          {/* Informations du patient */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Patient
              </h3>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-lg font-medium text-white">
                      {consultation.patient?.firstName?.[0]}{consultation.patient?.lastName?.[0]}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {consultation.patient?.firstName} {consultation.patient?.lastName}
                  </div>
                  {consultation.patient?.dateOfBirth && (
                    <div className="text-sm text-gray-500">
                      {calculateAge(consultation.patient.dateOfBirth)} ans
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {consultation.patient?.email && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Email:</span>
                    <span className="ml-2 text-gray-900">{consultation.patient.email}</span>
                  </div>
                )}
                {consultation.patient?.phone && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Téléphone:</span>
                    <span className="ml-2 text-gray-900">{consultation.patient.phone}</span>
                  </div>
                )}
                {consultation.patient?.medicalHistory && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Antécédents médicaux:</span>
                    <p className="ml-2 text-gray-900 whitespace-pre-wrap">{consultation.patient.medicalHistory}</p>
                  </div>
                )}
                {consultation.patient?.surgicalHistory && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Antécédents chirurgicaux:</span>
                    <p className="ml-2 text-gray-900 whitespace-pre-wrap">{consultation.patient.surgicalHistory}</p>
                  </div>
                )}
                <div>
                  <EditableField
                    label="Traitement en cours"
                    value={consultation.patient?.currentTreatment}
                    fieldName="currentTreatment"
                    entityId={consultation.patient?.id || ''}
                    updateFunction={updatePatientField}
                    inputType="textarea"
                    placeholder="Traitement actuel suivi par le patient"
                    onDirtyStateChange={handleDirtyStateChange}
                  />
                </div>
                {consultation.patient?.activities && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-500">Activité:</span>
                    <p className="ml-2 text-gray-900 whitespace-pre-wrap">{consultation.patient.activities}</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href={`/patients/${consultation.patient?.id}`}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Voir le dossier patient →
                </Link>
              </div>
            </div>
          </div>

          {/* Facturation */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Facturation
              </h3>
              {consultation.invoice ? (
                <div>
                  <div className="space-y-2 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-500">Statut:</span>
                      <span className={`ml-2 ${consultation.invoice.status === 'OVERDUE' ? 'text-red-600 font-bold' : 'text-gray-900'}`}>
                        {translateStatus(consultation.invoice.status || 'DRAFT')}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">Paiement:</span>
                      <span className="ml-2 text-gray-900">{translatePaymentMethod(consultation.invoice.paymentMethod)}</span>
                    </div>
                  </div>
                  <Link
                    href={`/invoices/${consultation.invoice.id}`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Voir la facture
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Aucune facture n&apos;est liée à cette consultation.</p>
                  <button
                    onClick={() => router.push(`/invoices/new?consultationId=${consultation.id}&patientId=${consultation.patient?.id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Créer une facture
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Métadonnées */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Métadonnées
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Créé le:</span>
                  <span className="ml-2 text-gray-900">
                    {consultation.createdAt ? formatDate(consultation.createdAt) : 'Non disponible'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Modifié le:</span>
                  <span className="ml-2 text-gray-900">
                    {consultation.updatedAt ? formatDate(consultation.updatedAt) : 'Non disponible'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Praticien:</span>
                  <span className="ml-2 text-gray-900">
                    <UserName userId={consultation.owner} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
