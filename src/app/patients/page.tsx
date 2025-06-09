'use client';

import { useEffect, useState } from 'react';
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import Link from 'next/link';
import ErrorAlert from '../../components/ErrorAlert';
import { useErrorHandler } from '../../hooks/useErrorHandler';

const client = generateClient<Schema>();

const selectionSet = ['id', 'firstName', 'lastName', 'email', 'phone', 'updatedAt'] as const;
type PatientListItem = SelectionSet<Schema['Patient']['type'], typeof selectionSet>;

export default function Page() {
  const { error, errorType, setError, clearError, handleAmplifyResponse } = useErrorHandler();
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientListItem[]>([]);
  const [searchLastName, setSearchLastName] = useState('');

  const fetchPatients = async () => {
    try {
      const normalizedSearch = searchLastName.trim().charAt(0).toUpperCase() + searchLastName.trim().slice(1).toLowerCase();
      const response = await client.models.Patient.list({
        filter: {
          or: [
            { lastName: { contains: searchLastName } },
            { lastName: { contains: normalizedSearch } },
          ],
        },
        selectionSet: selectionSet,
        limit: 20,
      });
      
      const data = handleAmplifyResponse(response);
      if (data) {
        setPatients(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors du chargement des patients'));
    } finally {
      setIsLoading(false);
    }
  }

  // Chargement initial des patients au montage du composant
  useEffect(() => {
    fetchPatients();
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
                setIsLoading(true);
                await fetchPatients();
                setIsLoading(false);
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
                disabled={isLoading}
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
      </div>

      {/* Statistiques */}
      {!isLoading && (
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