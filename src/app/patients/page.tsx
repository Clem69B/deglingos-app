'use client';

import { useEffect, useState } from 'react';
import { SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import Link from 'next/link';
import ErrorAlert from '../../components/ErrorAlert';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import usePatientManagement from '../../hooks/usePatientManagement';
import UserAvatar from '@/components/UserAvatar';

const selectionSet = ['id', 'firstName', 'lastName', 'email', 'phone', 'updatedAt'] as const;
type PatientListItem = SelectionSet<Schema['Patient']['type'], typeof selectionSet>;

export default function Page() {
  const { error, errorType, setError, clearError } = useErrorHandler();
  
  // Use patient management hook
  const { patients, loading, listPatients } = usePatientManagement({ onError: setError });
  
  const [searchLastName, setSearchLastName] = useState('');

  const fetchPatients = async () => {
    const normalizedSearch = searchLastName.trim();
    await listPatients(normalizedSearch ? { lastName: normalizedSearch, limit: 20 } : { limit: 20 });
  }

  // Chargement initial des patients au montage du composant
  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {/* Header */}
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

      {/* Research */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="max-w-lg">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Rechercher un patient
            </label>
            <form
              className="p-4 flex gap-2 items-center"
              onSubmit={async (e) => {
                e.preventDefault();
                await fetchPatients();
              }}
            >
              <input
                type="text"
                placeholder="Rechercher par nom de famille"
                className="pl-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-indigo-300 rounded-md shadow-sm"
                value={searchLastName}
                onChange={(e) => setSearchLastName(e.target.value)}
              />
              <button
                type="submit"
                className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 active:bg-indigo-800 "
                disabled={loading}
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {searchLastName ? 'Aucun patient trouvé pour cette recherche.' : 'Aucun patient enregistré.'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
          {patients.map((patient) => (
            <li key={patient.id}>
              <Link
                href={`/patients/${patient.id}`}
                className="block hover:bg-gray-50 px-4 py-4 sm:px-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserAvatar 
                        firstName={patient.firstName}
                        lastName={patient.lastName}
                        size="sm"
                      />
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
                    {patient.updatedAt && (
                      <div>
                        Mis à jour le {new Date(patient.updatedAt).toLocaleDateString('fr-FR')}
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
              {searchLastName ? (
                <>
                  {patients.length} patient(s) trouvé(s) 
                </>
              ) : (
                <>
                  {patients.length} patient(s) chargé(s)
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}