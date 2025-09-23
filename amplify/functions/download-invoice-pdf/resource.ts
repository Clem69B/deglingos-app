import { defineFunction } from '@aws-amplify/backend';

export const downloadInvoicePdf = defineFunction({
  name: 'download-invoice-pdf',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
});