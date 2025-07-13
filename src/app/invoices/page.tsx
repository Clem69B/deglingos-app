'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import useInvoiceManagement from '@/hooks/useInvoiceManagement';
import PatientCombobox from '@/components/PatientCombobox';
import ErrorAlert from '@/components/ErrorAlert';

const InvoicesPage = () => {
  const { invoices, loading, error, listInvoices } = useInvoiceManagement();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useEffect(() => {
    const filter = selectedPatientId ? { patientId: selectedPatientId } : undefined;
    listInvoices(filter);
  }, [selectedPatientId, listInvoices]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Factures</h1>
        <Link href="/invoices/new" className="btn btn-primary">
          Nouvelle Facture
        </Link>
      </div>

      <div className="max-w-sm">
        <PatientCombobox
          value={selectedPatientId || ''}
          onChange={setSelectedPatientId}
        />
      </div>

      {loading && <p>Chargement...</p>}
      {error && <ErrorAlert error={error} title="Erreur lors de la récupération des factures." />}

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Total</th>
              <th>Statut</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <Link href={`/invoices/${invoice.id}`} className="link link-primary">
                    {invoice.invoiceNumber}
                  </Link>
                </td>
                <td>{invoice.patient ? `${invoice.patient.firstName} ${invoice.patient.lastName}` : 'N/A'}</td>
                <td>{new Date(invoice.date).toLocaleDateString()}</td>
                <td>{invoice.total?.toFixed(2)} €</td>
                <td><span className="badge">{invoice.status}</span></td>
                <td>
                  <Link href={`/invoices/${invoice.id}`} className="btn btn-sm btn-ghost">
                    Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && invoices.length === 0 && (
          <p className="text-center py-4">Aucune facture trouvée.</p>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
