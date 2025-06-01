'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import Link from 'next/link';

const client = generateClient<Schema>();

export default function ConsultationsPage() {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredConsultations, setFilteredConsultations] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Filtrer les consultations en fonction des critères de recherche
    let filtered = [...consultations];

    // Filtrer par terme de recherche (motif, diagnostic, etc.)
    if (searchTerm) {
      filtered = filtered.filter(consultation =>
        consultation.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        consultation.treatment?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrer par patient
    if (selectedPatient) {
      filtered = filtered.filter(consultation => consultation.patientId === selectedPatient);
    }

    // Filtrer par date de début
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(consultation => 
        new Date(consultation.date) >= fromDate
      );
    }

    // Filtrer par date de fin
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // Inclure toute la journée
      filtered = filtered.filter(consultation => 
        new Date(consultation.date) <= toDate
      );
    }

    // Trier par date décroissante (plus récent en premier)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredConsultations(filtered);
  }, [consultations, searchTerm, selectedPatient, dateFrom, dateTo]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Charger les consultations avec les données du patient
      const consultationsResponse = await client.models.Consultation.list({
        selectionSet: ['id', 'date', 'duration', 'reason', 'symptoms', 'diagnosis', 'treatment', 'price', 'isPaid', 'patientId', 'patient.firstName', 'patient.lastName', 'patient.email', 'createdAt', 'updatedAt']
      });
      
      // Charger la liste des patients pour le filtre
      const patientsResponse = await client.models.Patient.list({
        selectionSet: ['id', 'firstName', 'lastName']
      });
      
      setConsultations(consultationsResponse.data || []);
      setPatients(patientsResponse.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
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
            Gérez l'historique des consultations de vos patients
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
                Jusqu'au
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
        ) : filteredConsultations.length === 0 ? (
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
            {filteredConsultations.map((consultation) => (
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
                        <div className="ml-2 flex-shrink-0 flex">
                          {consultation.isPaid ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Payé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Non payé
                            </span>
                          )}
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
                            {consultation.duration} min
                          </div>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          {consultation.price && formatPrice(consultation.price)}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Motif:</span> {consultation.reason}
                        </div>
                        {consultation.diagnosis && (
                          <div className="text-sm text-gray-500 mt-1">
                            <span className="font-medium">Diagnostic:</span> {consultation.diagnosis}
                          </div>
                        )}
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
      {!loading && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="text-sm text-gray-500">
              {searchTerm || selectedPatient || dateFrom || dateTo ? (
                <>
                  {filteredConsultations.length} consultation(s) trouvée(s) sur {consultations.length} total
                </>
              ) : (
                <>
                  {consultations.length} consultation(s) enregistrée(s)
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
