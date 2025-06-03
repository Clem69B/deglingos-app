'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import type { ConsultationWithPatient } from '../../../types';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function ConsultationDetailPage() {
  const params = useParams();
  const [consultation, setConsultation] = useState<ConsultationWithPatient | null>(null);
  const [loading, setLoading] = useState(true);

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
            'id', 'date', 'duration', 'reason', 'treatment', 'recommendations', 
            'notes', 'createdAt', 'updatedAt', 'nextAppointment',
            'anamnesisSkullCervical', 'anamnesisDigestive', 'anamnesisCardioThoracic',
            'anamnesisGynecological', 'anamnesisSleep', 'anamnesisPsychological',
            'patient.id', 'patient.firstName', 'patient.lastName', 
            'patient.email', 'patient.phone', 'patient.dateOfBirth'
          ]
        }
      );
      if (response.data) {
        setConsultation(response.data as ConsultationWithPatient);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la consultation:', error);
    } finally {
      setLoading(false);
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
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Motif</dt>
                  <dd className="mt-1 text-sm text-gray-900">{consultation.reason}</dd>
                </div>
                {consultation.nextAppointment && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Prochain rendez-vous</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDate(consultation.nextAppointment)}</dd>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Anamnèse */}
          {(consultation.anamnesisSkullCervical || consultation.anamnesisDigestive || 
            consultation.anamnesisCardioThoracic || consultation.anamnesisGynecological || 
            consultation.anamnesisSleep || consultation.anamnesisPsychological) && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Anamnèse
                </h3>
                <div className="space-y-4">
                  {consultation.anamnesisSkullCervical && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Crâne & Cervicale</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisSkullCervical}</dd>
                    </div>
                  )}
                  {consultation.anamnesisDigestive && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Système digestif</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisDigestive}</dd>
                    </div>
                  )}
                  {consultation.anamnesisCardioThoracic && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cardio-thoracique</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisCardioThoracic}</dd>
                    </div>
                  )}
                  {consultation.anamnesisGynecological && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Gynécologique</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisGynecological}</dd>
                    </div>
                  )}
                  {consultation.anamnesisSleep && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sommeil</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisSleep}</dd>
                    </div>
                  )}
                  {consultation.anamnesisPsychological && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Psychologique & Émotionnel</dt>
                      <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{consultation.anamnesisPsychological}</dd>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Traitement et suivi */}
          {(consultation.treatment || consultation.recommendations || consultation.notes) && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Traitement et suivi
                </h3>
                <div className="space-y-4">
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
          )}
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
                    {consultation.createdAt ? new Date(consultation.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Non disponible'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Modifié le:</span>
                  <span className="ml-2 text-gray-900">
                    {consultation.updatedAt ? new Date(consultation.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Non disponible'}
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
