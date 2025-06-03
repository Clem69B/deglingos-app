// Types communs utilisés à travers l'application

// Genre pour les patients
export type Gender = 'M' | 'F' | 'OTHER';

// Statut des factures
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';

// Interface de base pour les éléments avec ID
export interface BaseEntity {
  id: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Interface pour les erreurs de formulaire
export interface FormErrors {
  [key: string]: string;
}

// Interface pour les données de base d'une personne
export interface PersonBaseData {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
}
