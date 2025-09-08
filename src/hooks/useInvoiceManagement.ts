'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';
import type { Invoice, CreateInvoiceInput, UpdateInvoiceInput } from '@/types/invoice';

const client = generateClient<Schema>();

const useInvoiceManagement = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any | null>(null);

  // Helper to consistently shape the invoice data for the frontend
  const _resolveInvoiceRelationships = async (invoiceModel: Schema['Invoice']['type']): Promise<Invoice> => {
    const patient = (await invoiceModel.patient())?.data ?? null;
    const consultationData = (await invoiceModel.consultation())?.data ?? null;
    
    // Destructure to remove the original relationship functions
    const { patient: _, consultation: __, ...baseData } = invoiceModel;
    
    return {
      ...baseData,
      patient,
      consultation: consultationData ? { id: consultationData.id, date: consultationData.date } : null
    } as unknown as Invoice;
  };

  const listInvoices = useCallback(async (filter?: { patientId: string }) => {
    setLoading(true);
    setError(null);
    try {
      // Use selectionSet to fetch related patient data in a single query
      const { data, errors } = await client.models.Invoice.list({ 
        filter: filter ? { patientId: { eq: filter.patientId } } : undefined,
        selectionSet: [
          "id", "invoiceNumber", "date", "total", "status", "isPaid",
          "patient.id", "patient.firstName", "patient.lastName", "patient.email"
        ],
      });
      if (errors) throw errors;
      // We cast the result to our frontend Invoice type
      setInvoices(data as unknown as Invoice[]);
    } catch (err) {
      setError(err);
      console.error("Failed to list invoices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInvoiceById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.models.Invoice.get({ id });
      if (errors) throw errors;
      if (!data) throw new Error("Invoice not found.");
      
      const fullInvoiceData = await _resolveInvoiceRelationships(data);
      setInvoice(fullInvoiceData);
      return fullInvoiceData;
    } catch (err) {
      setError(err);
      console.error(`Failed to fetch invoice with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.models.Invoice.create(input);
      if (errors) throw errors;
      if (!data) return null;
      
      return await _resolveInvoiceRelationships(data);
    } catch (err) {
      setError(err);
      console.error("Failed to create invoice:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (input: UpdateInvoiceInput): Promise<Invoice | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, errors } = await client.models.Invoice.update(input);
      if (errors) throw errors;
      if (!data) return null;

      const updatedInvoice = await _resolveInvoiceRelationships(data);
      updateLocalCaches(updatedInvoice);
      return updatedInvoice;
    } catch (err) {
      setError(err);
      console.error("Failed to update invoice:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const setLocalInvoice = (updatedInvoice: Invoice | null) => {
    setInvoice(updatedInvoice);
  };

  // Sync single-invoice and invoices list (used for optimistic apply/revert)
  const updateLocalCaches = (updated: Invoice) => {
    setInvoice(updated);
    setInvoices(prev => prev.map(inv => inv.id === updated.id ? updated : inv));
  };

  // Generic field update with optimistic UI
  const updateField = async (id: string, fieldName: string, value: any): Promise<Invoice | null> => {
    // Ensure the invoice is loaded and is the one we are editing
    if (!invoice || invoice.id !== id) {
      await getInvoiceById(id);
    }
    if (!invoice) throw new Error('Invoice not loaded');

    const oldInvoice = { ...invoice };
    const updatedAt = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...invoice,
      [fieldName]: value,
      updatedAt,
    };

    // Optimistic update
    updateLocalCaches(updatedInvoice);

    try {
      const result = await updateInvoice({
        id,
        [fieldName]: value,
        updatedAt,
      } as UpdateInvoiceInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
      return result;
    } catch (err) {
      // Revert on failure
      updateLocalCaches(oldInvoice);
      setError(err);
      throw err;
    }
  };

  // Centralized transition helpers with optimistic updates
  const markAsPending = async (id: string) => {
    if (!invoice || invoice.id !== id) {
      // fetch if local invoice is missing or different
      await getInvoiceById(id);
    }
    if (!invoice) throw new Error('Invoice not loaded');

    const oldInvoice = { ...invoice };
    const updatedInvoice: Invoice = {
      ...invoice,
      status: 'PENDING',
      isPaid: false,
      paidAt: null,
      updatedAt: new Date().toISOString(),
    };

    // optimistic update
    updateLocalCaches(updatedInvoice);

    try {
      const result = await updateInvoice({
        id,
        status: 'PENDING',
        isPaid: false,
        paidAt: null,
        updatedAt: updatedInvoice.updatedAt,
      } as UpdateInvoiceInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
    } catch (err) {
      updateLocalCaches(oldInvoice);
      setError(err);
      throw err;
    }
  };

  const markAsPaid = async (id: string) => {
    if (!invoice || invoice.id !== id) {
      await getInvoiceById(id);
    }
    if (!invoice) throw new Error('Invoice not loaded');

    const oldInvoice = { ...invoice };
    const paidAt = new Date().toISOString();
    const updatedInvoice: Invoice = {
      ...invoice,
      status: 'PAID',
      isPaid: true,
      paidAt,
      updatedAt: paidAt,
    };

    updateLocalCaches(updatedInvoice);

    try {
      const result = await updateInvoice({
        id,
        status: 'PAID',
        isPaid: true,
        paidAt,
        updatedAt: updatedInvoice.updatedAt,
      } as UpdateInvoiceInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
    } catch (err) {
      updateLocalCaches(oldInvoice);
      setError(err);
      throw err;
    }
  };

  const unmarkAsPaid = async (id: string) => {
    if (!invoice || invoice.id !== id) {
      await getInvoiceById(id);
    }
    if (!invoice) throw new Error('Invoice not loaded');

    const oldInvoice = { ...invoice };
    const updatedInvoice: Invoice = {
      ...invoice,
      status: 'PENDING',
      isPaid: false,
      paidAt: null,
      updatedAt: new Date().toISOString(),
    };

    updateLocalCaches(updatedInvoice);

    try {
      const result = await updateInvoice({
        id,
        status: 'PENDING',
        isPaid: false,
        paidAt: null,
        updatedAt: updatedInvoice.updatedAt,
      } as UpdateInvoiceInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
    } catch (err) {
      updateLocalCaches(oldInvoice);
      setError(err);
      throw err;
    }
  };

  // Trigger backend email send (calls a Next.js API route that will proxy to an actual mailer / lambda)
  const sendInvoiceEmail = async (id: string) => {
    setError(null);
    try {
      // Ensure we have the latest invoice and patient email
      const current = await getInvoiceById(id);
      if (!current) throw new Error('Invoice not found');

      const email = current.patient?.email;
      if (!email) throw new Error('No patient email found for this invoice');

      // Fonction d'envoi non implémentée — lever une erreur explicite
      throw new Error("Fonction d'envoi d'email non disponible pour le moment.");
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return {
    invoices,
    invoice,
    loading,
    error,
    listInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    updateField,
    setLocalInvoice, // Expose the setter for optimistic updates
    // New actions
    markAsPending,
    markAsPaid,
    unmarkAsPaid,
    sendInvoiceEmail,
  };
};

export default useInvoiceManagement;
