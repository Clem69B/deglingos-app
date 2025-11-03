import type { BaseEntity } from './common';

// Appointment status enum
export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// Base data for appointment
export interface AppointmentBaseData {
  patientId?: string | null;
  date: string;
  duration?: number | null;
  status?: AppointmentStatus | null;
  notes?: string | null;
  source?: string | null;
  externalId?: string | null;
}

// Type for creating an appointment (without ID)
export type CreateAppointmentInput = AppointmentBaseData;

// Type for updating an appointment (with ID)
export interface UpdateAppointmentInput extends Partial<AppointmentBaseData> {
  id: string;
}

// Type for complete appointment data
export interface AppointmentDetail extends AppointmentBaseData, BaseEntity {
  syncedAt?: string | null;
}

// Type for appointment form data (used in components)
export interface AppointmentFormData {
  patientId: string;
  date: string;
  time: string;
  duration: string;
  status: AppointmentStatus | '';
  notes: string;
}
