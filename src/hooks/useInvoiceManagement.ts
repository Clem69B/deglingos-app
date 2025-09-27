'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { Invoice, CreateInvoiceInput, UpdateInvoiceInput } from '@/types/invoice';

const client = generateClient<Schema>();

interface UseInvoiceManagementOptions {
  onError: (error: string) => void;
}

const useInvoiceManagement = ({ onError }: UseInvoiceManagementOptions) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper to consistently shape the invoice data for the frontend
  const _resolveInvoiceRelationships = async (invoiceModel: Schema['Invoice']['type']): Promise<Invoice> => {
    const patient = (await invoiceModel.patient())?.data ?? null;
    const consultationData = (await invoiceModel.consultation())?.data ?? null;

    // Copy model and remove relationship accessors before returning
    const baseData = { ...(invoiceModel as Record<string, unknown>) } as Record<string, unknown>;
    delete baseData.patient;
    delete baseData.consultation;

    return {
      ...(baseData as Record<string, unknown>),
      patient,
      consultation: consultationData ? { id: consultationData.id, date: consultationData.date } : null,
    } as unknown as Invoice;
  };

  const normalizeError = (err: unknown): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'Unknown error';
    if (Array.isArray(err) && err.every(e => e && typeof e === 'object' && 'message' in e && typeof ((e as Record<string, unknown>).message) === 'string')) {
      return (err as Array<{ message: string }>).map(e => e.message).join(' | ');
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  };

  // Helper to consistently handle errors: normalize -> call onError or set local state
  const handleError = (err: unknown) => {
    const message = normalizeError(err);
    onError(message);
    return message;
  };

  const listInvoices = useCallback(async (filter?: { patientId: string }) => {
    setLoading(true);
    onError('');
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
      handleError(err);
      console.error("Failed to list invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const getInvoiceById = useCallback(async (id: string) => {
    setLoading(true);
    onError('');
    try {
      const { data, errors } = await client.models.Invoice.get({ id });
      if (errors) throw errors;
      if (!data) throw new Error("Invoice not found.");
      
      const fullInvoiceData = await _resolveInvoiceRelationships(data);
      setInvoice(fullInvoiceData);
      return fullInvoiceData;
    } catch (err) {
      handleError(err);
      console.error(`Failed to fetch invoice with ID ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onError]);

  const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice | null> => {
    setLoading(true);
    onError('');
    try {
      // Ensure dueDate is set: default to invoice date + 7 days when not provided
      const safeInput: CreateInvoiceInput = { ...input } as CreateInvoiceInput;
      if (!safeInput.dueDate) {
        const base = safeInput.date ? new Date(safeInput.date) : new Date();
        base.setDate(base.getDate() + 7);
        // store as ISO date (yyyy-mm-dd)
        safeInput.dueDate = base.toISOString().split('T')[0];
      }

      const { data, errors } = await client.models.Invoice.create(safeInput);
      if (errors) throw errors;
      if (!data) return null;
      
      return await _resolveInvoiceRelationships(data);
    } catch (err) {
      handleError(err);
      console.error("Failed to create invoice:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateInvoice = async (input: UpdateInvoiceInput): Promise<Invoice | null> => {
    setLoading(true);
    onError('');
    try {
      // If update includes `date`, always set dueDate = date + 7 days
      const safeInput: UpdateInvoiceInput = { ...input } as UpdateInvoiceInput;
      if (safeInput.date) {
        const base = new Date(safeInput.date);
        base.setDate(base.getDate() + 7);
        safeInput.dueDate = base.toISOString().split('T')[0];
      }

      const { data, errors } = await client.models.Invoice.update(safeInput);
      if (errors) throw errors;
      if (!data) return null;

      const updatedInvoice = await _resolveInvoiceRelationships(data);
      updateLocalCaches(updatedInvoice);
      return updatedInvoice;
    } catch (err) {
      handleError(err);
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
  const updateField = async (id: string, fieldName: string, value: unknown): Promise<Invoice | null> => {
    // Ensure the invoice is loaded and is the one we are editing
    if (!invoice || invoice.id !== id) {
      await getInvoiceById(id);
    }
    if (!invoice) throw new Error('Invoice not loaded');

    const oldInvoice = { ...invoice };
    const updatedInvoice: Invoice = {
      ...invoice,
      [fieldName]: value,
    };

    // Reset status to DRAFT if modifying total field and not currently DRAFT or PAID
    if (fieldName === 'total' && invoice.status !== 'DRAFT' && invoice.status !== 'PAID') {
      updatedInvoice.status = 'DRAFT';
    }

    // Optimistic update
    updateLocalCaches(updatedInvoice);

    try {
      const updateInput: UpdateInvoiceInput = {
        id,
        [fieldName]: value,
      };

      // Include status reset in the update if needed
      if (fieldName === 'total' && invoice.status !== 'DRAFT' && invoice.status !== 'PAID') {
        updateInput.status = 'DRAFT';
      }

      const result = await updateInvoice(updateInput);
      if (!result) throw new Error('Update failed');
      updateLocalCaches(result);
      return result;
    } catch (err) {
      // Revert on failure
      updateLocalCaches(oldInvoice);
      handleError(err);
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

      // Generate PDF when transitioning from DRAFT to PENDING
      if (oldInvoice.status === 'DRAFT') {
        try {
          await generateInvoicePDF(id);
        } catch (pdfError) {
          console.warn('PDF generation failed but status was updated:', pdfError);
          // Don't revert status change if PDF generation fails
        }
      }
    } catch (err) {
      updateLocalCaches(oldInvoice);
      handleError(err);
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
      handleError(err);
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
      handleError(err);
      throw err;
    }
  };

  // Generate PDF and store in S3
  const generateInvoicePDF = async (id: string): Promise<string | null> => {
    onError('');
    try {
      const { data, errors } = await client.mutations.generateInvoicePDF({ invoiceId: id });
      if (errors) throw errors;
      
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const result = parsedData as { success: boolean; pdfUrl?: string; message: string };
      if (!result.success) {
        throw new Error(`PDF generation failed: ${result.message}`);
      }
      
      return result.pdfUrl || null;
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  // Download PDF from S3 for printing
  const downloadInvoicePDF = async (id: string): Promise<void> => {
    onError('');
    try {
      const { data, errors } = await client.mutations.downloadInvoicePDF({ invoiceId: id });
      if (errors) throw errors;

      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const result = parsedData as { success: boolean; downloadUrl?: string; message: string };
      if (!result.success) {
        throw new Error(`PDF download failed: ${result.message}`);
      }
      
      if (result.downloadUrl) {
        // Trigger browser download
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = ''; // Let the server determine filename
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  // Send invoice email with PDF attachment
  const sendInvoiceEmail = async (id: string) => {
    onError('');
    try {
      // Ensure we have the latest invoice and patient email
      const current = await getInvoiceById(id);
      if (!current) throw new Error('Invoice not found');

      const email = current.patient?.email;
      if (!email) throw new Error('No patient email found for this invoice');

      // Call GraphQL mutation to send email with PDF
      const { data, errors } = await client.mutations.sendInvoiceEmail({ 
        invoiceId: id,
        recipientEmail: email 
      });
      if (errors) throw errors;
      
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      const result = parsedData as { success: boolean; message: string };
      if (!result.success) {
        throw new Error(`Invoice email sending failed: ${result.message}`);
      }
    } catch (err) {
      handleError(err);
      throw err;
    }
  };

  return {
    invoices,
    invoice,
    loading,
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
    // PDF functions
    generateInvoicePDF,
    downloadInvoicePDF,
  };
};

export default useInvoiceManagement;
