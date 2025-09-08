'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import useInvoiceManagement from '@/hooks/useInvoiceManagement';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import ErrorAlert from '@/components/ErrorAlert';
import Link from 'next/link';

const InvoiceDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  const { invoice, loading, error, getInvoiceById, updateField, markAsPending, markAsPaid, unmarkAsPaid, sendInvoiceEmail } = useInvoiceManagement();
  const [isUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      getInvoiceById(id);
    }
  }, [id, getInvoiceById]);

  const updateInvoiceField = useCallback(async (fieldName: string, value: unknown) => {
    if (!invoice) return;
    await updateField(invoice.id, fieldName, value);
  }, [invoice, updateField]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="page-title">Détails de la Facture</h1>
        <Link href="/invoices" className="btn btn-secondary">
          Retour
        </Link>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <ErrorAlert error={error} title="Erreur lors de la récupération de la facture." />}
      
      {invoice && !loading && (
        <InvoiceDetails 
          invoice={invoice}
          updateField={updateInvoiceField}
          markAsPending={markAsPending}
          markAsPaid={markAsPaid}
          unmarkAsPaid={unmarkAsPaid}
          sendInvoiceEmail={sendInvoiceEmail}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
