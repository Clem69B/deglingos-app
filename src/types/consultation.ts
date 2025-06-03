import type { BaseEntity } from './common';
import type { PatientSummary } from './patient';

// Interface pour les données d'anamnèse
export interface AnamnesisData {
  anamnesisSkullCervical?: string | null;
  anamnesisDigestive?: string | null;
  anamnesisCardioThoracic?: string | null;
  anamnesisGynecological?: string | null;
  amnamnesisSleep?: string | null;
  amnamnesisPsychological?: string | null;
}

// Interface de base pour les consultations
export interface ConsultationBaseData extends AnamnesisData {
  date: string; // ISO datetime string
  duration?: number | null;
  reason: string;
  treatment?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  nextAppointment?: string | null; // ISO datetime string
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
}

// Type pour résumé de consultation (utilisé dans le profil patient)
export interface ConsultationSummary extends BaseEntity {
  date: string;
  reason: string;
  duration?: number | null;
  patientId: string;
}
