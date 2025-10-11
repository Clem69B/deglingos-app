'use client';

import type { MonthlyRevenue } from '@/types/accounting';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import PaymentMethodBreakdown from './PaymentMethodBreakdown';

interface MonthlyRevenueSummaryProps {
  data: MonthlyRevenue | null;
  loading?: boolean;
}

export default function MonthlyRevenueSummary({ data, loading = false }: MonthlyRevenueSummaryProps) {
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

  if (!data || data.total === 0) {
    return (
      <div className="form-card">
        <div className="card-header">
          <h3 className="card-title">Résumé mensuel</h3>
        </div>
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
      </div>
    );
  }

  const monthDate = parse(data.month, 'yyyy-MM', new Date());
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: fr });

  return (
    <div className="form-card">
      <div className="card-header">
        <h3 className="card-title">Résumé {monthLabel}</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between py-2">
          <span className="text-gray-700">Total facturé:</span>
          <span className="font-semibold text-gray-900">{data.total.toFixed(2)} €</span>
        </div>
        
        <div className="border-t pt-3">
          <h4 className="font-medium text-gray-900 mb-2">Par moyen de paiement:</h4>
          <PaymentMethodBreakdown paymentMethods={data.paymentMethods} />
        </div>
        
        <div className="border-t pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-700">Nombre de factures:</span>
            <span className="font-medium text-gray-900">{data.invoiceCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
