'use client';

import { useEffect, useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import type { ConsultationListItem, PatientListItem } from '../../types';
import Link from 'next/link';

const client = generateClient<Schema>();

// Type pour le filtre de consultation
type ConsultationFilter = {
  patientId?: { eq: string };
  date?: { 
    between?: [string, string];
    ge?: string;
    le?: string;
  };
  or?: Array<{ reason?: { contains: string } }>;
};

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<ConsultationListItem[]>([]); // Utilisation de la nouvelle interface
  const [patients, setPatients] = useState<PatientListItem[]>([]); // Utilisation du type Patient local ou global
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [hasMoreResults, setHasMoreResults] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchPatientsAndConsultations();
  }, []);

  const fetchPatientsAndConsultations = async () => {
    try {
      setLoading(true);

      // Fetch patients
      const patientsResponse = await client.models.Patient.list({
        selectionSet: ['id', 'firstName', 'lastName', 'createdAt']
      });
      
      // Filtrer et transformer les données pour correspondre au type PatientListItem
      const validPatients = (patientsResponse.data || [])
        .filter(patient => patient.id)
        .map(patient => ({
          id: patient.id!,
          firstName: patient.firstName || null,
          lastName: patient.lastName || null,
          email: null, // Non récupéré dans cette requête
          phone: null, // Non récupéré dans cette requête
          dateOfBirth: null, // Non récupéré dans cette requête
          createdAt: patient.createdAt!
        }));
      
      setPatients(validPatients);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    }
  };

  const fetchConsultations = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Build filter conditions
      const filter: ConsultationFilter = {};
      
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
          { reason: { contains: searchTerm } },
          // Si vous souhaitez toujours rechercher dans les notes ou d'autres champs non affichés directement :
          // { notes: { contains: searchTerm } }, 
          // { anamnesisSkullCervical: { contains: searchTerm } }, 
          // etc.
          // Pour une simplification maximale basée sur l'affichage :
          // Uniquement la raison si les autres champs ne sont plus dans ConsultationListItem
        ];
      }

      const consultationsResponse = await client.models.Consultation.list({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        limit: ITEMS_PER_PAGE,
        nextToken: reset ? undefined : nextToken,
        selectionSet: [
          'id', 
          'date', 
          'reason', 
          'duration',
          'patientId',
          'patient.firstName', 
          'patient.lastName'
        ]
      });

      const newConsultations = (consultationsResponse.data || []) as ConsultationListItem[]; // Cast vers la nouvelle interface
      
      if (reset) {
        setConsultations(newConsultations);
      } else {
        setConsultations(prev => [...prev, ...newConsultations]);
      }

      setNextToken(consultationsResponse.nextToken || null);
      setHasMoreResults(!!consultationsResponse.nextToken);

    } catch (error) {
      console.error('Erreur lors du chargement des consultations:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm, selectedPatient, dateFrom, dateTo, nextToken]);

  useEffect(() => {
    // Reset pagination when filters change
    setConsultations([]);
    setNextToken(null);
    setHasMoreResults(true);
    fetchConsultations(true);
  }, [searchTerm, selectedPatient, dateFrom, dateTo, fetchConsultations]);

  const loadMoreConsultations = () => {
    if (!loadingMore && hasMoreResults) {
      fetchConsultations(false);
    }
  };

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
      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Consultations
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez l&apos;historique des consultations de vos patients
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
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Motif, diagnostic, symptômes..."
                />
              </div>
            </div>

            {/* Filtre par patient */}
            <div>
              <label htmlFor="patient" className="block text-sm font-medium text-gray-700">
                Patient
              </label>
              <select
                id="patient"
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option value="">Tous les patients</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
        {loading ? (
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
          <>
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
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <div className="mr-6 flex items-center text-sm text-gray-500">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {formatDate(consultation.date)}
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {consultation.duration || 60} min
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
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
            
            {/* Bouton "Charger plus" */}
            {hasMoreResults && (
              <div className="px-4 py-4 text-center border-t border-gray-200">
                <button
                  onClick={loadMoreConsultations}
                  disabled={loadingMore}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Chargement...
                    </>
                  ) : (
                    `Charger plus de consultations`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Statistiques */}
      {!loading && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-sm text-gray-500">
              {consultations.length} consultation(s) affichée(s)
              {hasMoreResults && ' (plus de résultats disponibles)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
