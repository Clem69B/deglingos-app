import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { updateOverdueInvoices } from './functions/update-overdue-invoices/resource';
import { generateInvoicePdf } from './functions/generate-invoice-pdf/resource';
import { sendInvoiceEmail } from './functions/send-invoice-email/resource';
import { downloadInvoicePdf } from './functions/download-invoice-pdf/resource';

export const backend = defineBackend({
  auth,
  data,
  storage,
  updateOverdueInvoices,
  generateInvoicePdf,
  sendInvoiceEmail,
  downloadInvoicePdf,
});

// Grant the scheduled function access to the Invoice table
backend.updateOverdueInvoices.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.data.resources.tables['Invoice'].grantReadWriteData(backend.updateOverdueInvoices.resources.lambda);

// Grant PDF generation function access to Invoice and Patient tables and S3 storage
backend.generateInvoicePdf.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.generateInvoicePdf.addEnvironment('AMPLIFY_DATA_PATIENT_TABLE_NAME', backend.data.resources.tables['Patient'].tableName);
backend.generateInvoicePdf.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.generateInvoicePdf.resources.lambda);
backend.data.resources.tables['Patient'].grantReadData(backend.generateInvoicePdf.resources.lambda);
backend.storage.resources.bucket.grantReadWrite(backend.generateInvoicePdf.resources.lambda);

// Grant email function access to Invoice and Patient tables and S3 storage
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_DATA_PATIENT_TABLE_NAME', backend.data.resources.tables['Patient'].tableName);
backend.sendInvoiceEmail.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.data.resources.tables['Patient'].grantReadData(backend.sendInvoiceEmail.resources.lambda);
backend.storage.resources.bucket.grantRead(backend.sendInvoiceEmail.resources.lambda);

// Grant download function access to Invoice table and S3 storage
backend.downloadInvoicePdf.addEnvironment('AMPLIFY_DATA_INVOICE_TABLE_NAME', backend.data.resources.tables['Invoice'].tableName);
backend.downloadInvoicePdf.addEnvironment('AMPLIFY_STORAGE_BUCKET_NAME', backend.storage.resources.bucket.bucketName);
backend.data.resources.tables['Invoice'].grantReadData(backend.downloadInvoicePdf.resources.lambda);
backend.storage.resources.bucket.grantRead(backend.downloadInvoicePdf.resources.lambda);

// Ajout de permissions spécifiques
backend.addOutput({
  custom: {
    region: process.env.AWS_REGION || 'eu-west-3',
  },
});
