import type { BaseEntity, InvoiceStatus } from './common';
import type { PatientSummary } from './patient';
import type { PaymentMethod } from './invoice';

// Interface pour les données d'anamnèse
export interface AnamnesisData {
  skull?: string | null;
  cervical?: string | null;
  digestive?: string | null;
  cardioThoracic?: string | null;
  gynecological?: string | null;
  sleep?: string | null;
  psychological?: string | null;
}

// Interface de base pour les consultations
export interface ConsultationBaseData {
  date: string; // ISO datetime string
  duration?: number | null;
  reason: string;
  anamnesis?: AnamnesisData | null;
  treatment?: string | null;
  recommendations?: string | null;
  notes?: string | null;
}

// Type pour créer une consultation (avec patientId)
export interface CreateConsultationInput extends ConsultationBaseData {
  patientId: string;
}

// Type pour mettre à jour une consultation (avec ID, sans patientId)
export interface UpdateConsultationInput extends Partial<ConsultationBaseData> {
  id: string;
  // patientId ne devrait généralement pas changer lors d'une mise à jour
}

// Type pour l'affichage en liste
export interface ConsultationListItem {
  id: string;
  date: string;
  reason: string;
  duration?: number | null;
  patientId: string;
  patient?: {
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

// Type pour les consultations avec patient inclus (vue détaillée)
export interface ConsultationWithPatient extends ConsultationBaseData, BaseEntity {
  patientId?: string;
  patient?: PatientSummary | null;
  owner?: string | null;
  invoice?: {
    id: string;
    status?: InvoiceStatus | null;
    paymentMethod?: PaymentMethod | null;
  } | null;
}

// Type pour résumé de consultation (utilisé dans le profil patient)
export interface ConsultationSummary extends BaseEntity {
  date: string;
  reason: string;
  duration?: number | null;
  patientId: string;
}
