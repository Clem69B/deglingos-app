import React from 'react';
import Link from 'next/link';
import type { InvoiceSummary } from '@/types/invoice';
import { translateStatus, getStatusBadgeColor } from '@/lib/invoiceStatus';

interface UnpaidInvoicesProps {
  invoices: InvoiceSummary[];
  formatDate?: (dateString: string | null | undefined) => string;
}

const defaultFormatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export default function UnpaidInvoices({ invoices, formatDate = defaultFormatDate }: UnpaidInvoicesProps) {
  if (!invoices || invoices.length === 0) return null;

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Factures impayées</h3>
      <div className="space-y-3">
        {invoices.slice(0, 3).map((invoice) => (
          <Link 
            key={invoice.id} 
            href={`/invoices/${invoice.id}`}
            className="clickable-item clickable-item-alert"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-red-900">{
                  `Facture #${invoice.invoiceNumber}`
                }</p>
                <p className="text-xs text-red-700">{formatDate(invoice.date)}</p>
              </div>
              <span className="text-sm font-medium text-red-900">{invoice.total}€</span>
            </div>
            <div className="mt-2">
              <span className={`badge ${getStatusBadgeColor(invoice.status || 'DRAFT')}`}>
                {translateStatus(invoice.status || 'DRAFT')}
              </span>
            </div>
          </Link>
        ))}
        {invoices.length > 3 && (
          <p className="text-sm text-gray-500 text-center">Et {invoices.length - 3} autres...</p>
        )}
      </div>
    </div>
  );
}
