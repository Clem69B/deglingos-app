import { defineAuth } from '@aws-amplify/backend';

/**
 * This file defines the authentication configuration for the application.
 * It specifies how users can log in, the attributes required, and the user groups.
 * 
 * MFA Configuration:
 * - TOTP (Time-based One-Time Password) is the recommended method
 * - Email MFA is available as a fallback option
 * - MFA is optional by default in development/sandbox, but is enforced as mandatory in production and staging environments via environment configuration
 */
export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    givenName: {
      mutable: true,
      required: true,
    },
    familyName: {
      mutable: true,
      required: true,
    },
    phoneNumber: {
      mutable: true,
      required: false,
    },
  },
  groups: ['osteopaths', 'assistants', 'admins'],
  multifactor: {
    mode: 'OPTIONAL',
    totp: true,
    sms: false,
  }
});
