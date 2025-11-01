'use client';

import { useEffect, useState } from 'react';
import type { MonthlyRevenue } from '@/types/accounting';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import PaymentMethodBreakdown from './PaymentMethodBreakdown';

interface MonthlyRevenueSummaryProps {
  monthlyData?: MonthlyRevenue[];
  loading?: boolean;
}

export default function MonthlyRevenueSummary({ monthlyData = [], loading = false }: MonthlyRevenueSummaryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!monthlyData || monthlyData.length === 0) {
      setSelectedIndex(0);
      return;
    }

    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const currentIndex = monthlyData.findIndex((month) => month.month === currentMonthKey);

    if (currentIndex >= 0) {
      setSelectedIndex(currentIndex);
    } else {
      setSelectedIndex(monthlyData.length - 1);
    }
  }, [monthlyData]);

  if (loading) {
    return (
      <div className="form-card">
        <div className="card-header">
          <h3 className="card-title">Résumé mensuel</h3>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  const hasData = monthlyData && monthlyData.length > 0;
  const clampedIndex = hasData ? Math.min(Math.max(selectedIndex, 0), monthlyData.length - 1) : 0;
  const resolvedData = hasData ? monthlyData[clampedIndex] : null;

  const monthDate = resolvedData ? parse(resolvedData.month, 'yyyy-MM', new Date()) : null;
  const monthLabel = monthDate && !Number.isNaN(monthDate.getTime())
    ? format(monthDate, 'MMMM yyyy', { locale: fr })
    : null;

  const atFirstMonth = clampedIndex === 0;
  const atLastMonth = hasData ? clampedIndex === monthlyData.length - 1 : true;

  return (
    <div className="form-card">
      <div className="card-header">
        <h3 className="card-title">Résumé mensuel</h3>
        {monthLabel && (
          <div className="flex items-center space-x-2">
            {hasData && (
              <button
                type="button"
                onClick={() => setSelectedIndex((prev) => Math.max(0, prev - 1))}
                disabled={atFirstMonth}
                aria-label="Mois précédent"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            )}
            <span className="text-sm font-medium text-gray-900 capitalize">{monthLabel}</span>
            {hasData && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) => {
                    const lastIndex = Math.max(0, (monthlyData?.length || 1) - 1);
                    return Math.min(prev + 1, lastIndex);
                  })
                }
                disabled={atLastMonth}
                aria-label="Mois suivant"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m8.25 4.5 7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {!resolvedData || resolvedData.total === 0 ? (
          <div className="space-y-4">
            <div className="empty-state">
              <svg 
                className="mx-auto h-10 w-10 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              <p className="empty-state-text">Aucune donnée pour ce mois</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between py-2">
              <span className="text-gray-700">Total facturé:</span>
              <span className="font-semibold text-gray-900">{resolvedData.total.toFixed(2)} €</span>
            </div>
            
            <div className="border-t pt-3">
              <h4 className="font-medium text-gray-900 mb-2">Par moyen de paiement:</h4>
              <PaymentMethodBreakdown paymentMethods={resolvedData.paymentMethods} />
            </div>
            
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Nombre de factures:</span>
                <span className="font-medium text-gray-900">{resolvedData.invoiceCount}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
