'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function ConsultationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [consultation, setConsultation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchConsultation(params.id as string);
    }
  }, [params.id]);

  const fetchConsultation = async (id: string) => {
    try {
      setLoading(true);
      const response = await client.models.Consultation.get(
        { id },
        {
          selectionSet: [
            'id', 'date', 'duration', 'reason', 'symptoms', 'examination', 
            'diagnosis', 'treatment', 'recommendations', 'price', 'isPaid', 
            'notes', 'createdAt', 'updatedAt',
            'patient.id', 'patient.firstName', 'patient.lastName', 
            'patient.email', 'patient.phone', 'patient.dateOfBirth'
          ]
        }
      );
      setConsultation(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la consultation:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentStatus = async () => {
    if (!consultation) return;

    setUpdating(true);
    try {
      await client.models.Consultation.update({
        id: consultation.id,
        isPaid: !consultation.isPaid
      });
      
      setConsultation(prev => ({
        ...prev,
        isPaid: !prev.isPaid
      }));
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de paiement:', error);
      alert('Erreur lors de la mise à jour du statut de paiement');
    } finally {
      setUpdating(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-sm text-gray-500">Chargement de la consultation...</div>
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
          <button
            onClick={togglePaymentStatus}
            disabled={updating}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              consultation.isPaid
                ? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
                : 'text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500'
            } disabled:opacity-50`}
          >
            {updating ? 'Mise à jour...' : consultation.isPaid ? 'Marquer comme non payé' : 'Marquer comme payé'}
          </button>
          <Link
            href={`/consultations/${consultation.id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Modifier
          </Link>
          <Link
            href="/consultations"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Retour
          </Link>
        </div>
      </div>

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
                  <dt className="text-sm font-medium text-gray-500">Date et heure</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(consultation.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Durée</dt>
                  <dd className="mt-1 text-sm text-gray-900">{consultation.duration} minutes</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Motif</dt>
                  <dd className="mt-1 text-sm text-gray-900">{consultation.reason}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Statut de paiement</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      consultation.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {consultation.isPaid ? 'Payé' : 'Non payé'}
                    </span>
                  </dd>
                </div>
                {consultation.price && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Prix</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatPrice(consultation.price)}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Détails médicaux */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Détails médicaux
              </h3>
              <div className="space-y-4">
                {consultation.symptoms && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Symptômes</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.symptoms}</dd>
                  </div>
                )}
                {consultation.examination && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Examen clinique</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.examination}</dd>
                  </div>
                )}
                {consultation.diagnosis && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Diagnostic</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.diagnosis}</dd>
                  </div>
                )}
                {consultation.treatment && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Traitement</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.treatment}</dd>
                  </div>
                )}
                {consultation.recommendations && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Recommandations</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.recommendations}</dd>
                  </div>
                )}
                {consultation.notes && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Notes privées</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.notes}</dd>
                  </div>
                )}
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
                    {new Date(consultation.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Modifié le:</span>
                  <span className="ml-2 text-gray-900">
                    {new Date(consultation.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
