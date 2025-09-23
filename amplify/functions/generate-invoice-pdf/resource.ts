import { defineFunction } from '@aws-amplify/backend';

export const generateInvoicePdf = defineFunction({
  name: 'generate-invoice-pdf',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
});