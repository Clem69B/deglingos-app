'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { generateClient, SelectionSet } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useErrorHandler } from '../hooks/useErrorHandler';

const client = generateClient<Schema>();

const patientSelectionSet = ['id', 'firstName', 'lastName'] as const;
type PatientOption = SelectionSet<Schema['Patient']['type'], typeof patientSelectionSet>;

interface PatientComboboxProps {
  value: string;
  onChange: (patientId: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function PatientCombobox({ 
  value, 
  onChange, 
  placeholder = "Rechercher un patient...",
  className = "",
  disabled = false
}: PatientComboboxProps) {
  const { setError, handleAmplifyResponse } = useErrorHandler();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false); // Nouveau state pour tracker si l'utilisateur tape
  
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Recherche avec debouncing
  const searchPatients = useCallback(async (term: string) => {
    if (term.length < 2) {
      setPatients([]);
      return;
    }

    try {
      setIsLoading(true);
      
      const normalizedTerm = term.charAt(0).toUpperCase() + term.slice(1).toLowerCase();
      
      const response = await client.models.Patient.list({
        filter: {
          or: [
            { firstName: { contains: term } },
            { firstName: { contains: normalizedTerm } },
            { lastName: { contains: term } },
            { lastName: { contains: normalizedTerm } }
          ]
        },
        selectionSet: patientSelectionSet,
        limit: 10
      });

      const data = handleAmplifyResponse(response);
      if (data) {
        setPatients(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erreur lors de la recherche de patients'));
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  }, [handleAmplifyResponse, setError]);

  // Debouncing de la recherche
  const debouncedSearch = useCallback((term: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchPatients(term);
    }, 300);
  }, [searchPatients]);

  // Effet pour la recherche
  useEffect(() => {
    if (searchTerm) {
      debouncedSearch(searchTerm);
    } else {
      setPatients([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, debouncedSearch]);

  // Trouver le patient sélectionné par son ID
  useEffect(() => {
    if (value && !isTyping) { // Seulement si on ne tape pas
      // Chercher d'abord dans la liste actuelle
      const found = patients.find(p => p.id === value);
      if (found) {
        setSelectedPatient(found);
        setSearchTerm(`${found.firstName} ${found.lastName}`);
      } else {
        // Si pas trouvé, faire une requête spécifique
        const fetchSelectedPatient = async () => {
          try {
            const response = await client.models.Patient.get({
              id: value
            }, {
              selectionSet: patientSelectionSet
            });
            const data = handleAmplifyResponse(response);
            if (data) {
              setSelectedPatient(data);
              setSearchTerm(`${data.firstName} ${data.lastName}`);
            }
          } catch (err) {
            console.warn('Patient sélectionné non trouvé:', err);
          }
        };
        fetchSelectedPatient();
      }
    } else if (!value) {
      setSelectedPatient(null);
      if (!isTyping) {
        setSearchTerm('');
      }
    }
  }, [value, patients, handleAmplifyResponse, isTyping]);

  // Gestion du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < patients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && patients[highlightedIndex]) {
          selectPatient(patients[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectPatient = (patient: PatientOption) => {
    setSelectedPatient(patient);
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
    onChange(patient.id ?? '');
    setIsOpen(false);
    setHighlightedIndex(-1);
    setIsTyping(false); // Arrêter le mode "typing"
  };

  const clearSelection = () => {
    setSelectedPatient(null);
    setSearchTerm('');
    onChange('');
    setPatients([]);
    setIsTyping(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsTyping(true); // Marquer qu'on est en train de taper
    
    // Si on modifie après sélection, clear la sélection seulement côté parent
    if (selectedPatient && newValue !== `${selectedPatient.firstName} ${selectedPatient.lastName}`) {
      setSelectedPatient(null);
      onChange('');
    }
    
    if (newValue.length >= 2) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    } else {
      setIsOpen(false);
      setPatients([]);
    }

    // Arrêter le mode "typing" après un délai
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // Arrêter le mode typing après 1 seconde d'inactivité
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setIsOpen(true);
    }
    // Si on a un patient sélectionné, permettre la modification
    if (selectedPatient) {
      setIsTyping(true);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur un élément de la liste
    setTimeout(() => {
      setIsOpen(false);
      setIsTyping(false);
    }, 200);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10 pl-3 py-2 disabled:bg-gray-100"
          autoComplete="off"
          disabled={disabled}
        />
        
        {/* Bouton clear */}
        {selectedPatient && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute inset-y-0 right-8 flex items-center pr-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Icône de recherche ou loading */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Liste déroulante */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {patients.length > 0 ? (
            <ul ref={listRef} className="divide-y divide-gray-200">
              {patients.map((patient, index) => (
                <li
                  key={patient.id}
                  className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-indigo-50 ${
                    index === highlightedIndex ? 'bg-indigo-50' : ''
                  }`}
                  onClick={() => selectPatient(patient)}
                >
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : searchTerm.length >= 2 && !isLoading ? (
            <div className="py-2 px-3 text-gray-500 text-sm">
              Aucun patient trouvé
            </div>
          ) : searchTerm.length < 2 ? (
            <div className="py-2 px-3 text-gray-500 text-sm">
              Tapez au moins 2 caractères pour rechercher
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
