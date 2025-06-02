import type { Patient } from '../types'; // Importation du type Patient global

export interface ConsultationListItem {
  id: string;
  date: string; // ISO datetime string
  reason: string;
  duration?: number | null;
  patientId: string;
  patient?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

// Exporter le type Patient si nécessaire ailleurs
export { Patient };