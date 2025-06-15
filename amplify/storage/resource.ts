import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'osteopathieStorage',
  access: (allow) => ({
    'patient_attachments/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete'])
    ],
  }),
});