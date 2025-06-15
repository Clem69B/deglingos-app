'use client';

import { useEffect, useState } from 'react';
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import Link from 'next/link';
import ErrorAlert from '../../components/ErrorAlert';
import PatientCombobox from '../../components/PatientCombobox';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const client = generateClient<Schema>();

// Selection sets pour optimiser les requêtes
const consultationSelectionSet = [
  'id', 
  'date', 
  'reason', 
  'duration',
  'patientId',
  'patient.firstName', 
  'patient.lastName'
] as const;

type ConsultationListItem = SelectionSet<Schema['Consultation']['type'], typeof consultationSelectionSet>;

export default function ConsultationsPage() {
  const { error, errorType, setError, clearError, handleAmplifyResponse } = useErrorHandler();
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      // Build filter conditions
      const filter: Record<string, unknown> = {};
      
      if (selectedPatient) {
        filter.patientId = { eq: selectedPatient };
      }

      if (dateFrom && dateTo) {
        filter.date = { 
          between: [dateFrom + 'T00:00:00.000Z', dateTo + 'T23:59:59.999Z']
        };
      } else if (dateFrom) {
        filter.date = { ge: dateFrom + 'T00:00:00.000Z' };
      } else if (dateTo) {
        filter.date = { le: dateTo + 'T23:59:59.999Z' };
      }

      // Add text search filter
      if (searchTerm) {
        filter.or = [
          { reason: { contains: searchTerm } }
        ];
      }

      const consultationsResponse = await client.models.Consultation.list({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        limit: 20,
        selectionSet: consultationSelectionSet
      });

      const consultationsData = handleAmplifyResponse(consultationsResponse);
      if (consultationsData) {
        // Trier par date décroissante (plus récentes en premier)
        const sortedConsultations = [...consultationsData].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setConsultations(sortedConsultations);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des consultations'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading) {
      fetchConsultations();
    }
  }, [searchTerm, selectedPatient, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedPatient('');
    setDateFrom('');
    setDateTo('');
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

  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      <ErrorAlert 
        error={error}
        type={errorType}
        title="Erreur de chargement"
        onClose={clearError}
        autoClose={false}
      />

      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Consultations
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez l&apos;historique des consultations de vos patients (20 dernières)
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/consultations/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nouvelle consultation
          </Link>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Recherche textuelle */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                Rechercher
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pl-10 pr-3 py-2"
                  placeholder="Motif de consultation..."
                />
              </div>
            </div>

            {/* Filtre par patient - Nouveau composant */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Patient
              </label>
              <div className="mt-1">
                <PatientCombobox
                  value={selectedPatient}
                  onChange={setSelectedPatient}
                  placeholder="Rechercher un patient..."
                />
              </div>
            </div>

            {/* Date de début */}
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700">
                À partir du
              </label>
              <input
                type="date"
                id="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>

            {/* Date de fin */}
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700">
                Jusqu&apos;au
              </label>
              <input
                type="date"
                id="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm py-2 px-3"
              />
            </div>
          </div>

          {/* Bouton pour effacer les filtres */}
          {(searchTerm || selectedPatient || dateFrom || dateTo) && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Effacer les filtres
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Liste des consultations */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {isLoading ? (
          <div className="px-4 py-12 text-center">
            <div className="text-sm text-gray-500">Chargement des consultations...</div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-sm text-gray-500">
              {searchTerm || selectedPatient || dateFrom || dateTo ? 
                'Aucune consultation trouvée pour ces critères' : 
                'Aucune consultation enregistrée'
              }
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {consultations.map((consultation) => (
              <li key={consultation.id}>
                <Link
                  href={`/consultations/${consultation.id}`}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium text-indigo-600 truncate">
                          {consultation.patient?.firstName} {consultation.patient?.lastName}
                        </div>
                        <div className="ml-2 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {formatDate(consultation.date)}
                        </div>
                      </div>
                      <div className="mt-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Motif:</span> {consultation.reason}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Statistiques */}
      {!isLoading && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-sm text-gray-500">
              {consultations.length} consultation(s) affichée(s) (limité aux 20 plus récentes)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
