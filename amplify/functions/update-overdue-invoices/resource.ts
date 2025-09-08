import { defineFunction } from '@aws-amplify/backend';

export const updateOverdueInvoices = defineFunction({
  name: 'update-overdue-invoices',
  schedule: '0 2 * * ? *', // Every day at 02:00 UTC
  resourceGroupName: 'invoiceManagement',
});