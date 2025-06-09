import type { BaseEntity, PersonBaseData, Gender } from './common';

// Interface de base pour les données patient
export interface PatientBaseData extends PersonBaseData {
  dateOfBirth?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  gender?: Gender | null;
  profession?: string | null;
  referringPhysician?: string | null;
  medicalHistory?: string | null;
  surgicalHistory?: string | null;
  currentMedications?: string | null;
  activities?: string | null;
}

// Type pour créer un patient (sans ID)
export type CreatePatientInput = PatientBaseData;

// Type pour mettre à jour un patient (avec ID)
export interface UpdatePatientInput extends Partial<PatientBaseData> {
  id: string;
}

// Type pour les données complètes d'un patient
export interface PatientDetail extends PatientBaseData, BaseEntity {}

// Type pour l'affichage en liste (champs minimums)
export interface PatientListItem extends BaseEntity {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}

// Type pour les formulaires de patient (utilisé dans les composants)
export interface PatientFormData {
  // Tous les champs sont requis dans le formulaire mais peuvent être vides
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
  gender: Gender | '';
  profession: string;
  referringPhysician: string;
  medicalHistory: string;
  surgicalHistory: string;
  currentMedications: string;
  activities: string;
}

// Type pour un résumé minimal de patient (utilisé dans les consultations)
export interface PatientSummary {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  dateOfBirth?: string | null;
}
