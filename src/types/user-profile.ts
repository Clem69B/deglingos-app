// UserProfile types for the frontend
export interface UserProfile {
  userId: string;
  email: string;
  givenName: string;
  familyName: string;
  phoneNumber?: string | null;
  professionalTitle?: string | null;
  postalAddress?: string | null;
  siret?: string | null;
  rpps?: string | null;
  defaultConsultationPrice?: number | null;
  invoiceFooter?: string | null;
  signatureS3Key?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfileFormData {
  professionalTitle: string;
  postalAddress: string;
  siret: string;
  rpps: string;
  defaultConsultationPrice: string;
  invoiceFooter: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface SignatureUploadResult {
  success: boolean;
  key?: string;
  error?: string;
}
