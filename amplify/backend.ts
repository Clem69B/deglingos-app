import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { updateOverdueInvoices } from './functions/update-overdue-invoices/resource';
import { generateInvoicePdf } from './functions/generate-invoice-pdf/resource';
import { sendInvoiceEmail } from './functions/send-invoice-email/resource';
import { downloadInvoicePdf } from './functions/download-invoice-pdf/resource';
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

const currentEnvironment = process.env.AMPLIFY_ENVIRONMENT || 'sandbox';
const isProduction = currentEnvironment === 'production' || currentEnvironment === 'prod';

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

// Authorize email function to send emails via SES
const sesPolicy = new PolicyStatement({
  sid: "AllowSESSendEmail",
  actions: ['ses:SendEmail', 'ses:SendRawEmail'],
  resources: ['*'],
});
backend.sendInvoiceEmail.resources.lambda.addToRolePolicy(sesPolicy);

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

if (isProduction) {
  console.log('🔒 Enable Point-in-time Recovery for all tables (Prod only)');
  
  // Enable Point-in-time Recovery for all tables
  Object.values(backend.data.resources.tables).forEach(table => {
    table.tableArn; // Ensure table is properly initialized
    const cfnTable = table.node.defaultChild as any;
    if (cfnTable) {
      cfnTable.pointInTimeRecoverySpecification = {
        pointInTimeRecoveryEnabled: true,
      };
    }
  });
} else {
  console.log(`⚠️  AWS Backup deactivated for : ${currentEnvironment}`);
}

