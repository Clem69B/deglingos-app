'use client';

import { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import Link from 'next/link';
import type { PatientListItem } from '../../types';

const client = generateClient<Schema>();

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [filteredPatients, setFilteredPatients] = useState<PatientListItem[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    // Filtrer les patients en fonction du terme de recherche
    const filtered = patients.filter(patient =>
      patient.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await client.models.Patient.list({
        selectionSet: ["id", "firstName", "lastName", "email", "phone", "dateOfBirth", "createdAt"]
      });
      
      // Filtrer et transformer les données pour correspondre au type PatientListItem
      const fetchedPatients: PatientListItem[] = (response.data || [])
        .filter(p => p.id) // Filtrer les patients avec un id valide
        .map(p => ({
          id: p.id!,
          firstName: p.firstName || null,
          lastName: p.lastName || null,
          email: p.email || null,
          phone: p.phone || null,
          dateOfBirth: p.dateOfBirth || null,
          createdAt: p.createdAt!,
        }));
      
      setPatients(fetchedPatients);
    } catch (error) {
      console.error('Erreur lors du chargement des patients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Patients
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gérez vos patients et leurs informations
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <Link
            href="/patients/new"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Nouveau patient
          </Link>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="max-w-lg">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Rechercher un patient
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Nom, prénom, email ou téléphone..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des patients */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="px-4 py-12 text-center">
            <div className="text-sm text-gray-500">Chargement des patients...</div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="text-sm text-gray-500">
              {searchTerm ? 'Aucun patient trouvé pour cette recherche' : 'Aucun patient enregistré'}
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredPatients.map((patient) => (
              <li key={patient.id}>
                <Link
                  href={`/patients/${patient.id}`}
                  className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {patient.firstName?.[0]}{patient.lastName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.email}
                        </div>
                        {patient.phone && (
                          <div className="text-sm text-gray-500">
                            {patient.phone}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-sm text-gray-500">
                      {patient.dateOfBirth && (
                        <div>
                          Né(e) le {new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                      {patient.createdAt && (
                        <div className="mt-1">
                          Créé le {new Date(patient.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
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
              {searchTerm ? (
                <>
                  {filteredPatients.length} patient(s) trouvé(s) sur {patients.length} total
                </>
              ) : (
                <>
                  {patients.length} patient(s) enregistré(s)
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
