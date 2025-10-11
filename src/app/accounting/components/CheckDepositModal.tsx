'use client';

import React, { useState, useEffect } from 'react';
import type { CheckInvoice } from '@/hooks/useCheckManagement';

interface CheckDepositModalProps {
  isOpen: boolean;
  selectedChecks: CheckInvoice[];
  onClose: () => void;
  onConfirm: (depositDate: string) => Promise<void>;
}

const CheckDepositModal: React.FC<CheckDepositModalProps> = ({
  isOpen,
  selectedChecks,
  onClose,
  onConfirm,
}) => {
  const [depositDate, setDepositDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset date when modal opens
  useEffect(() => {
    if (isOpen) {
      setDepositDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const totalAmount = selectedChecks.reduce((sum, check) => sum + (check.total ?? 0), 0);

  const handleConfirm = async () => {
    if (!depositDate) return;

    setIsSubmitting(true);
    try {
      await onConfirm(depositDate);
      onClose();
    } catch (err) {
      console.error('Failed to deposit checks:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">
          Encaisser {selectedChecks.length} chèque{selectedChecks.length > 1 ? 's' : ''}
        </h3>

        <div className="py-4">
          <label className="label">
            <span className="label-text font-medium">Date d&apos;encaissement à la banque</span>
          </label>
          <input
            type="date"
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
            className="input input-bordered w-full"
            max={new Date().toISOString().split('T')[0]} // Cannot be in the future
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">Chèques sélectionnés:</h4>
          <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
            {selectedChecks.map((check) => (
              <div key={check.id} className="flex justify-between items-start text-sm bg-white p-2 rounded">
                <div className="flex-1">
                  <div className="font-medium">
                    {check.patient?.firstName} {check.patient?.lastName}
                  </div>
                  <div className="text-gray-600 text-xs">
                    Facture {check.invoiceNumber}
                    {check.notes && (
                      <span className="ml-2 text-gray-500">
                        • {check.notes.length > 50 ? `${check.notes.substring(0, 50)}...` : check.notes}
                      </span>
                    )}
                  </div>
                </div>
                <div className="font-medium text-right ml-4">
                  {check.total?.toFixed(2)}€
                </div>
              </div>
            ))}
          </div>
          <div className="font-bold mt-3 text-right text-lg border-t pt-2">
            Total: {totalAmount.toFixed(2)}€
          </div>
        </div>

        <div className="modal-action">
          <button 
            className="btn" 
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={!depositDate || isSubmitting}
          >
            {isSubmitting ? 'Encaissement en cours...' : 'Confirmer l\'encaissement'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckDepositModal;
