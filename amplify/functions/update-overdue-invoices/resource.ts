import { defineFunction } from '@aws-amplify/backend';

export const updateOverdueInvoices = defineFunction({
  name: 'update-overdue-invoices',
  schedule: 'cron(0 2 * * ? *)', // Every day at 02:00 UTC
});