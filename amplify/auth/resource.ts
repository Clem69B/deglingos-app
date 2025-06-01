import { defineAuth } from '@aws-amplify/backend';

/**
 * This file defines the authentication configuration for the application.
 * It specifies how users can log in, the attributes required, and the user groups.
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
  groups: ['osteopaths', 'assistants'],
});