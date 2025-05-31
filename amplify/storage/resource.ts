import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'osteopathieStorage',
  access: (allow) => ({
    'invoices/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete']),
      allow.groups(['assistants']).to(['read', 'write']),
    ],
    'documents/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete']),
      allow.groups(['assistants']).to(['read', 'write']),
    ],
    'exports/*': [
      allow.groups(['osteopaths']).to(['read', 'write', 'delete']),
    ],
  }),
});