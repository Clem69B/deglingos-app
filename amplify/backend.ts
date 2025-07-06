import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
});

// Ajout de permissions spécifiques
backend.addOutput({
  custom: {
    region: process.env.AWS_REGION || 'eu-west-3',
  },
});
