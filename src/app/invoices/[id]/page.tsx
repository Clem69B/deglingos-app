'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import useInvoiceManagement from '@/hooks/useInvoiceManagement';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';
import ErrorAlert from '@/components/ErrorAlert';
import Link from 'next/link';
import type { Invoice } from '@/types/invoice';

const InvoiceDetailPage = () => {
  const params = useParams();
  const id = params.id as string;
  const { invoice, loading, error, getInvoiceById, updateInvoice, setLocalInvoice } = useInvoiceManagement();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      getInvoiceById(id);
    }
  }, [id, getInvoiceById]);

  const updateInvoiceField = useCallback(async (fieldName: string, value: any) => {
    if (!invoice) return;

    const oldInvoice = { ...invoice };
    const updatedInvoice = { ...invoice, [fieldName]: value };
    
    // Optimistic update
    setLocalInvoice(updatedInvoice);

    try {
      const result = await updateInvoice({ id: invoice.id, [fieldName]: value });
      if (!result) {
        throw new Error('Update failed');
      }
    } catch (err) {
      // Revert on failure
      setLocalInvoice(oldInvoice);
      // Re-throw to be caught by EditableField if needed
      throw err;
    }
  }, [invoice, updateInvoice, setLocalInvoice]);

  const togglePaidStatus = useCallback(async () => {
    if (!invoice) return;

    setIsUpdatingStatus(true);
    const oldInvoice = { ...invoice };
    const newPaidStatus = !invoice.isPaid;
    
    const updatedInvoice: Invoice = { 
      ...invoice, 
      isPaid: newPaidStatus,
      status: newPaidStatus ? 'PAID' : 'SENT', // Or whatever logic is appropriate
      paidAt: newPaidStatus ? new Date().toISOString() : null,
    };

    // Optimistic update
    setLocalInvoice(updatedInvoice);

    try {
      const result = await updateInvoice({ 
        id: invoice.id, 
        isPaid: newPaidStatus,
        status: updatedInvoice.status,
        paidAt: updatedInvoice.paidAt,
      });
      if (!result) {
        throw new Error('Update failed');
      }
    } catch (err) {
      // Revert on failure
      setLocalInvoice(oldInvoice);
    } finally {
      setIsUpdatingStatus(false);
    }
  }, [invoice, updateInvoice, setLocalInvoice]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Détails de la Facture</h1>
        <Link href="/invoices" className="btn btn-ghost">
          Retour à la liste
        </Link>
      </div>

      {loading && <p>Chargement...</p>}
      {error && <ErrorAlert error={error} title="Erreur lors de la récupération de la facture." />}
      
      {invoice && !loading && (
        <InvoiceDetails 
          invoice={invoice}
          updateField={updateInvoiceField}
          togglePaidStatus={togglePaidStatus}
          isUpdatingStatus={isUpdatingStatus}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;
