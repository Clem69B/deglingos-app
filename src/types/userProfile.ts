/**
 * User profile data structure matching Cognito attributes
 */
export interface UserProfile {
  // Standard Cognito attributes
  givenName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;

  // Custom attributes
  professionalTitle?: string;
  postalAddress?: string;
  siret?: string;
  rpps?: string;
  defaultConsultationPrice?: string;
  invoiceFooter?: string;
}

/**
 * Validation errors for profile fields
 */
export interface ProfileValidationErrors {
  givenName?: string;
  familyName?: string;
  email?: string;
  phoneNumber?: string;
  professionalTitle?: string;
  postalAddress?: string;
  siret?: string;
  rpps?: string;
  defaultConsultationPrice?: string;
  invoiceFooter?: string;
}
