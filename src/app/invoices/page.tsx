'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useInvoiceManagement from '@/hooks/useInvoiceManagement';
import PatientCombobox from '@/components/PatientCombobox';
import ErrorAlert from '@/components/ErrorAlert';
import { getStatusBadgeColor, translateStatus } from '@/lib/invoiceStatus';

const InvoicesPage = () => {
  const { invoices, loading, error, listInvoices } = useInvoiceManagement();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const filter = selectedPatientId ? { patientId: selectedPatientId } : undefined;
    listInvoices(filter);
  }, [selectedPatientId, listInvoices]);

  const clearFilters = () => {
    setSelectedPatientId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };



  return (
    <div className="space-y-6">
      {/* Affichage des erreurs */}
      {error && (
        <ErrorAlert 
          error={error} 
          title="Erreur lors de la récupération des factures" 
        />
      )}

      {/* En-tête */}
      <div className="page-header">
        <div className="page-header-content">
          <h2 className="page-title">
            Factures
          </h2>
          <p className="page-subtitle">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <div className="page-actions">
          <Link href="/invoices/new" className="btn-primary">
            Nouvelle Facture
          </Link>
        </div>
      </div>

      {/* Filtres de recherche */}
      <div className="filter-card">
        <div className="filter-card-content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Filtre par patient */}
            <div>
              <label className="form-label">
                Filtrer par patient
              </label>
              <div className="mt-1">
                <PatientCombobox
                  value={selectedPatientId || ''}
                  onChange={setSelectedPatientId}
                  placeholder="Rechercher un patient..."
                />
              </div>
            </div>
          </div>

          {/* Bouton pour effacer les filtres */}
          {selectedPatientId && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="btn-secondary"
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

      {/* Liste des factures */}
      <div className="content-card">
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-text">Chargement des factures...</div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">
              {selectedPatientId ? 
                'Aucune facture trouvée pour ce patient' : 
                'Aucune facture enregistrée'
              }
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link 
                        href={`/invoices/${invoice.id}`} 
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {invoice.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.patient ? 
                          `${invoice.patient.firstName} ${invoice.patient.lastName}` : 
                          'N/A'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.date ? formatDate(invoice.date) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.total?.toFixed(2)} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusBadgeColor(invoice.status || 'DRAFT')}`}>
                        {translateStatus(invoice.status || 'DRAFT')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        href={`/invoices/${invoice.id}`} 
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Détails
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Statistiques */}
      {!loading && (
        <div className="stats-card">
          <div className="stats-card-content">
            <div className="empty-state-text">
              {invoices.length} facture(s) affichée(s)
              {selectedPatientId && " pour le patient sélectionné"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;
