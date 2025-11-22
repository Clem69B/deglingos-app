'use client';

import { useState, useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import type { MonthlyRevenue } from '@/types/accounting';
import { format, startOfMonth, subMonths } from 'date-fns';

const client = generateClient<Schema>();

interface UseAccountingDataOptions {
  onError: (error: string) => void;
}

export const useAccountingData = ({ onError }: UseAccountingDataOptions) => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeError = (err: unknown): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message || 'Unknown error';
    if (Array.isArray(err) && err.every(e => e && typeof e === 'object' && 'message' in e)) {
      return (err as Array<{ message: string }>).map(e => e.message).join(' | ');
    }
    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  };

  const handleError = useCallback((err: unknown) => {
    const message = normalizeError(err);
    onError(message);
    return message;
  }, [onError]);

  // Get monthly revenue for the last N months
  const getMonthlyRevenue = useCallback(async (monthsBack: number = 6) => {
    setLoading(true);
    onError('');

    try {
      // Calculate date range - last N months including current month
      const endDate = new Date();
      const startDate = startOfMonth(subMonths(endDate, monthsBack - 1));

      // Format dates for GraphQL filter (ISO datetime strings)
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Query PAID invoices within date range
      const { data, errors } = await client.models.Invoice.list({
        filter: {
          status: { eq: 'PAID' },
          paidAt: {
            between: [startDateStr, endDateStr]
          }
        },
        selectionSet: ['id', 'total', 'paidAt', 'paymentMethod'],
      });

      if (errors) throw errors;

      // Aggregate data by month
      const aggregated: Record<string, MonthlyRevenue> = {};

      data.forEach((invoice) => {
        if (!invoice.paidAt || !invoice.total) return;

        // Handle paidAt which could be a string or Date
        const paidAtDate = typeof invoice.paidAt === 'string'
          ? new Date(invoice.paidAt)
          : invoice.paidAt;
        const month = format(paidAtDate, 'yyyy-MM');

        if (!aggregated[month]) {
          aggregated[month] = {
            month,
            total: 0,
            paymentMethods: {
              CHECK: 0,
              BANK_TRANSFER: 0,
              CASH: 0,
              CARD: 0,
            },
            invoiceCount: 0,
          };
        }

        aggregated[month].total += invoice.total;
        aggregated[month].invoiceCount += 1;

        // Add to payment method breakdown
        if (invoice.paymentMethod) {
          aggregated[month].paymentMethods[invoice.paymentMethod] += invoice.total;
        }
      });

      // Convert to array and sort by month (oldest to newest)
      const monthlyArray = Object.values(aggregated).sort((a, b) =>
        a.month.localeCompare(b.month)
      );

      // Fill in missing months with zero data
      const filledData: MonthlyRevenue[] = [];
      for (let i = 0; i < monthsBack; i++) {
        const monthDate = startOfMonth(subMonths(endDate, monthsBack - 1 - i));
        const monthKey = format(monthDate, 'yyyy-MM');

        const existing = monthlyArray.find(m => m.month === monthKey);
        if (existing) {
          filledData.push(existing);
        } else {
          filledData.push({
            month: monthKey,
            total: 0,
            paymentMethods: {
              CHECK: 0,
              BANK_TRANSFER: 0,
              CASH: 0,
              CARD: 0,
            },
            invoiceCount: 0,
          });
        }
      }

      setMonthlyData(filledData);
    } catch (err) {
      handleError(err);
      console.error('Failed to fetch monthly revenue:', err);
    } finally {
      setLoading(false);
    }
  }, [onError, handleError]);

  // Get current month revenue data
  const getCurrentMonthRevenue = useCallback((): MonthlyRevenue | null => {
    const currentMonth = format(new Date(), 'yyyy-MM');
    return monthlyData.find(m => m.month === currentMonth) || null;
  }, [monthlyData]);

  return {
    monthlyData,
    loading,
    error: null, // We handle errors via onError callback
    getMonthlyRevenue,
    getCurrentMonthRevenue,
    refreshData: () => getMonthlyRevenue(6),
  };
};
