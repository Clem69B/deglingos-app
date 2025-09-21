import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { updateOverdueInvoices } from './functions/update-overdue-invoices/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  updateOverdueInvoices,
});

// Grant the scheduled function access to the Invoice table
backend.updateOverdueInvoices.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.data.resources.tables['Invoice'].grantReadWriteData(backend.updateOverdueInvoices.resources.lambda);

// Ajout de permissions spécifiques
backend.addOutput({
  custom: {
    region: process.env.AWS_REGION || 'eu-west-3',
  },
});
