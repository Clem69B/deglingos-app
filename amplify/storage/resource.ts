import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'osteopathieStorage',
  access: (allow) => ({
    'patient_attachments/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete'])
    ],
    'invoices/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete']),
      allow.groups(['assistants']).to(['read'])
    ],
    'user_signatures/*': [
      allow.authenticated().to(['read', 'write', 'delete'])
    ],
  }),
});