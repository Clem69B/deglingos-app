'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { Invoice } from '@/types/invoice';

const client = generateClient<Schema>();

interface UseCheckManagementOptions {
  onError: (error: string) => void;
}

export interface CheckInvoice extends Invoice {
  depositDate?: string | null;
  isDeposited: boolean;
}

export interface CheckManagement {
  undepositedChecks: CheckInvoice[];
  loading: boolean;
  markAsDeposited: (invoiceIds: string[], depositDate: string) => Promise<void>;
  refreshChecks: () => Promise<void>;
}

export const useCheckManagement = ({ onError }: UseCheckManagementOptions): CheckManagement => {
  const [undepositedChecks, setUndepositedChecks] = useState<CheckInvoice[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeError = (err: unknown): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'Unknown error';
    if (Array.isArray(err) && err.every(e => e && typeof e === 'object' && 'message' in e)) {
      return (err as Array<{ message: string }>).map(e => e.message).join(' | ');
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  };

  const handleError = (err: unknown) => {
    const message = normalizeError(err);
    onError(message);
    return message;
  };

  // Helper to resolve invoice relationships
  const _resolveInvoiceRelationships = async (invoiceModel: Schema['Invoice']['type']): Promise<CheckInvoice> => {
    const patient = (await invoiceModel.patient())?.data ?? null;

    // Copy model and remove relationship accessors before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { patient: _p, consultation: _c, ...rest } = invoiceModel;
    
    return {
      ...rest,
      patient: patient ? {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email ?? null,
        phone: patient.phone ?? null,
      } : null,
      consultation: null,
      isDeposited: rest.isDeposited ?? false,
    } as CheckInvoice;
  };

  // Get all undeposited checks
  const getUndepositedChecks = useCallback(async () => {
    setLoading(true);
    onError('');

    try {
      const { data, errors } = await client.models.Invoice.list({
        filter: {
          paymentMethod: { eq: 'CHECK' },
          status: { eq: 'PAID' },
          isDeposited: { eq: false }
        },
      });

      if (errors) throw errors;

      // Resolve relationships for each invoice
      const resolvedInvoices = await Promise.all(
        data.map(invoice => _resolveInvoiceRelationships(invoice))
      );

      // Sort by date (oldest first)
      resolvedInvoices.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      setUndepositedChecks(resolvedInvoices);
    } catch (err) {
      handleError(err);
      console.error('Failed to fetch undeposited checks:', err);
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Mark checks as deposited
  const markAsDeposited = useCallback(async (invoiceIds: string[], depositDate: string) => {
    // Validate deposit date is not in the future
    const depositDateObj = new Date(depositDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    if (depositDateObj > today) {
      const errorMsg = 'La date d\'encaissement ne peut pas être dans le futur';
      handleError(errorMsg);
      throw new Error(errorMsg);
    }

    setLoading(true);
    onError('');

    try {
      // Update all invoices in parallel
      const updatePromises = invoiceIds.map(id =>
        client.models.Invoice.update({
          id,
          isDeposited: true,
          depositDate,
          updatedAt: new Date().toISOString()
        })
      );

      const results = await Promise.all(updatePromises);

      // Check for errors
      const failedUpdates = results.filter(result => result.errors);
      if (failedUpdates.length > 0) {
        throw new Error(`Failed to update ${failedUpdates.length} invoice(s)`);
      }

      // Refresh the list
      await getUndepositedChecks();
    } catch (err) {
      handleError(err);
      console.error('Failed to mark checks as deposited:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [onError, getUndepositedChecks]);

  return {
    undepositedChecks,
    loading,
    markAsDeposited,
    refreshChecks: getUndepositedChecks,
  };
};
