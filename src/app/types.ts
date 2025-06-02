import type { Schema } from '../../amplify/data/resource';

export type Patient = Schema['Patient']['type'];
export type Consultation = Schema['Consultation']['type'];
export type Invoice = Schema['Invoice']['type'];

// Vous pourriez aussi ajouter d'autres types utiles

// Champs nécessaires pour créer une consultation, sans les champs générés automatiquement ou relationnels complexes
export interface CreateConsultationInput {
  patientId: string;
  date: string; // ISO datetime string
  duration?: number | null;
  reason: string;
  treatment?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  anamnesisSkullCervical?: string | null;
  anamnesisDigestive?: string | null;
  anamnesisCardioThoracic?: string | null;
  anamnesisGynecological?: string | null;
  amnamnesisSleep?: string | null;
  amnamnesisPsychological?: string | null;
  nextAppointment?: string | null; // ISO datetime string
}

// Champs nécessaires pour créer un patient, sans les champs générés automatiquement
export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  gender?: 'M' | 'F' | 'OTHER' | null;
  profession?: string | null;
  emergencyContact?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
}

export interface UpdateConsultationInput extends Partial<Omit<CreateConsultationInput, 'patientId'>> {
  id: string;
  // patientId ne devrait généralement pas changer lors d'une mise à jour de consultation.
  // Si c'est le cas, il peut être ajouté ici.
}

// Type pour la mise à jour des patients
export interface UpdatePatientInput {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  gender?: 'M' | 'F' | 'OTHER' | null;
  profession?: string | null;
  emergencyContact?: string | null;
  medicalHistory?: string | null;
  allergies?: string | null;
  currentMedications?: string | null;
}

// Type spécifique pour les données de consultation retournées par Amplify avec patient inclus
export interface ConsultationWithPatient {
  id: string | null;
  date: string;
  duration: number | null;
  reason: string;
  treatment?: string | null;
  recommendations?: string | null;
  notes?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  nextAppointment?: string | null;
  anamnesisSkullCervical?: string | null;
  anamnesisDigestive?: string | null;
  anamnesisCardioThoracic?: string | null;
  anamnesisGynecological?: string | null;
  amnamnesisSleep?: string | null;
  amnamnesisPsychological?: string | null;
  patient?: {
    id: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    dateOfBirth: string | null;
  } | null;
}