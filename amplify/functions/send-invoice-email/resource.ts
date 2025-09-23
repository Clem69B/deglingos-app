import { defineFunction } from '@aws-amplify/backend';
import { backend } from '../../backend';

export const sendInvoiceEmail = defineFunction({
  name: 'send-invoice-email',
  timeoutSeconds: 30,
  memoryMB: 512,
  resourceGroupName: 'data',
  environment: {
    SES_SENDER_EMAIL: 'noreply@deglingos.eu'
  }
});