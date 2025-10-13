/**
 * Validators for user profile fields
 */

/**
 * Validates email format
 */
export function validateEmail(email: string): string | null {
  if (!email) return null; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Format d\'email invalide';
  }
  return null;
}

/**
 * Validates phone number format
 * Accepts international format with + and various separators
 */
export function validatePhoneNumber(phone: string): string | null {
  if (!phone) return null; // Optional field
  const phoneRegex = /^[+]?[\d\s\-\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return 'Format de téléphone invalide';
  }
  return null;
}

/**
 * Validates SIRET number (14 digits)
 */
export function validateSiret(siret: string): string | null {
  if (!siret) return null; // Optional field
  const siretRegex = /^\d{14}$/;
  if (!siretRegex.test(siret.replace(/\s/g, ''))) {
    return 'Le SIRET doit contenir 14 chiffres';
  }
  return null;
}

/**
 * Validates RPPS number (11 digits)
 */
export function validateRpps(rpps: string): string | null {
  if (!rpps) return null; // Optional field
  const rppsRegex = /^\d{11}$/;
  if (!rppsRegex.test(rpps.replace(/\s/g, ''))) {
    return 'Le numéro RPPS doit contenir 11 chiffres';
  }
  return null;
}

/**
 * Validates default consultation price (numeric)
 */
export function validateConsultationPrice(price: string): string | null {
  if (!price) return null; // Optional field
  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    return 'Le tarif doit être un nombre positif';
  }
  return null;
}

/**
 * Validates all profile fields
 */
export function validateProfileField(fieldName: string, value: string): string | null {
  switch (fieldName) {
    case 'email':
      return validateEmail(value);
    case 'phoneNumber':
      return validatePhoneNumber(value);
    case 'siret':
      return validateSiret(value);
    case 'rpps':
      return validateRpps(value);
    case 'defaultConsultationPrice':
      return validateConsultationPrice(value);
    default:
      return null;
  }
}
