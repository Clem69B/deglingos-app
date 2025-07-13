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
          "patient.id", "patient.firstName", "patient.lastName"
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
      setInvoice(updatedInvoice);
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

  return {
    invoices,
    invoice,
    loading,
    error,
    listInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    setLocalInvoice, // Expose the setter for optimistic updates
  };
};

export default useInvoiceManagement;
