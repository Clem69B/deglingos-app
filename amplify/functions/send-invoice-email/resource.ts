import { defineFunction } from '@aws-amplify/backend';

export const sendInvoiceEmail = defineFunction({
  name: 'send-invoice-email',
  timeoutSeconds: 30,
  memoryMB: 512,
});