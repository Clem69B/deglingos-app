import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { updateOverdueInvoices } from './functions/update-overdue-invoices/resource';
import { sendInvoiceEmail } from './functions/send-invoice-email/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  updateOverdueInvoices,
  sendInvoiceEmail,
});

// Grant the scheduled function access to the Invoice table
backend.updateOverdueInvoices.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.data.resources.tables['Invoice'].grantReadWriteData(backend.updateOverdueInvoices.resources.lambda);

// Grant the email function access to Invoice and Patient tables
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_PATIENT_TABLE_NAME', backend.data.resources.tables['Patient'].tableName);
backend.sendInvoiceEmail.addEnvironment('SENDER_EMAIL', process.env.SENDER_EMAIL || 'noreply@deglingos-app.com');
backend.sendInvoiceEmail.addEnvironment('CABINET_NAME', process.env.CABINET_NAME || 'Cabinet d\'Ostéopathie');
backend.data.resources.tables['Invoice'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.data.resources.tables['Patient'].grantReadData(backend.sendInvoiceEmail.resources.lambda);

// Add SES permissions to the email function
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
backend.sendInvoiceEmail.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'], // In production, you might want to restrict this to specific verified email addresses
  })
);

// Ajout de permissions spécifiques
backend.addOutput({
  custom: {
    region: process.env.AWS_REGION || 'eu-west-3',
  },
});
