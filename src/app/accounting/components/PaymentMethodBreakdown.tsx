'use client';

import type { PaymentMethod } from '@/types/invoice';

interface PaymentMethodBreakdownProps {
  paymentMethods: {
    CHEQUE: number;
    VIREMENT: number;
    ESPECES: number;
    CARTE_BANCAIRE: number;
  };
}

const translatePaymentMethod = (method: PaymentMethod): string => {
  const translations: Record<PaymentMethod, string> = {
    CHEQUE: 'Chèques',
    VIREMENT: 'Virements',
    ESPECES: 'Espèces',
    CARTE_BANCAIRE: 'Carte bancaire',
  };
  return translations[method];
};

export default function PaymentMethodBreakdown({ paymentMethods }: PaymentMethodBreakdownProps) {
  const methods: PaymentMethod[] = ['CHEQUE', 'VIREMENT', 'ESPECES', 'CARTE_BANCAIRE'];

  return (
    <div className="space-y-1 text-sm">
      {methods.map((method) => {
        const amount = paymentMethods[method];
        if (amount === 0) return null;
        
        return (
          <div key={method} className="flex justify-between">
            <span className="text-gray-600">{translatePaymentMethod(method)}:</span>
            <span className="text-gray-900">{amount.toFixed(2)} €</span>
          </div>
        );
      })}
      {methods.every(method => paymentMethods[method] === 0) && (
        <div className="text-gray-500 text-xs italic">Aucun paiement enregistré</div>
      )}
    </div>
  );
}
