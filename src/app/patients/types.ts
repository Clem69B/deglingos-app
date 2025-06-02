export interface PatientListItem {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  createdAt: string;
}

export interface PatientDetail {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null; // ISO date string
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  gender?: 'M' | 'F' | 'OTHER' | null;
  profession?: string | null;
  emergencyContact?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
  createdAt?: string | null; // ISO datetime string
  updatedAt?: string | null; // ISO datetime string
}

export interface ConsultationSummary {
  id: string;
  date: string; // ISO datetime string
  reason: string; // Based on schema, reason is required
  duration?: number | null;
  patientId: string; // For relational integrity, though not always used in this specific UI
}

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string; // Based on schema, invoiceNumber is required
  date: string; // ISO date string
  total: number; // Based on schema, total is required
  status?: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | null;
  patientId: string; // For relational integrity
}
