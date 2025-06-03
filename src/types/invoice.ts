import type { BaseEntity } from './common';
import type { InvoiceStatus } from './common';

// Interface de base pour les factures
export interface InvoiceBaseData {
  invoiceNumber: string;
  date: string; // ISO date string
  dueDate?: string | null;
  price?: number | null;
  tax?: number | null;
  total: number;
  status?: InvoiceStatus | null;
  notes?: string | null;
  isPaid?: boolean | null;
  paidAt?: string | null;
}

// Type pour créer une facture
export interface CreateInvoiceInput extends InvoiceBaseData {
  patientId: string;
  consultationId?: string | null;
}

// Type pour mettre à jour une facture
export interface UpdateInvoiceInput extends Partial<InvoiceBaseData> {
  id: string;
}

// Type pour résumé de facture (utilisé dans le profil patient)
export interface InvoiceSummary extends BaseEntity {
  invoiceNumber: string;
  date: string;
  total: number;
  status?: InvoiceStatus | null;
  patientId: string;
}
