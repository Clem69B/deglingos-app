'use client';

import React from 'react';
import type { CheckInvoice } from '@/hooks/useCheckManagement';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CheckListProps {
  checks: CheckInvoice[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onQuickDeposit: (id: string) => void;
}

const CheckList: React.FC<CheckListProps> = ({
  checks,
  selectedIds,
  onSelectionChange,
  onQuickDeposit,
}) => {
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      onSelectionChange(checks.map((check) => check.id));
    } else {
      onSelectionChange([]);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const isCheckOld = (dateStr: string) => {
    const checkDate = new Date(dateStr);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 30;
  };

  if (checks.length === 0) {
    return (
      <div className="empty-state py-8">
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
            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
          />
        </svg>
        <p className="empty-state-text">Aucun chèque en attente d&apos;encaissement</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table table-compact w-full">
        <thead>
          <tr>
            <th className="w-12">
              <input
                type="checkbox"
                checked={checks.length > 0 && selectedIds.length === checks.length}
                onChange={handleSelectAll}
                className="checkbox checkbox-sm"
              />
            </th>
            <th>Patient</th>
            <th>N° Facture</th>
            <th className="text-right">Montant</th>
            <th>Date facture</th>
            <th>Référence</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((check) => {
            const isOld = isCheckOld(check.date);
            return (
              <tr
                key={check.id}
                className={isOld ? 'bg-yellow-50' : ''}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(check.id)}
                    onChange={() => handleToggleSelect(check.id)}
                    className="checkbox checkbox-sm"
                  />
                </td>
                <td>
                  <div className="font-medium">
                    {check.patient?.firstName} {check.patient?.lastName}
                  </div>
                </td>
                <td>
                  <span className="text-sm">{check.invoiceNumber}</span>
                </td>
                <td className="text-right">
                  <span className="font-medium">{check.total?.toFixed(2)}€</span>
                </td>
                <td className="text-right">
                  <span className="text-sm">{formatDate(check.date)}</span>
                </td>
                <td className="text-right">
                  <span className="text-sm text-gray-600">
                    {check.paymentReference ? (
                      check.paymentReference.length > 40 ? `${check.paymentReference.substring(0, 40)}...` : check.paymentReference
                    ) : (
                      '-'
                    )}
                  </span>
                </td>
                <td className="text-center">
                  <button
                    className="btn btn-xs btn-primary"
                    onClick={() => onQuickDeposit(check.id)}
                  >
                    Encaisser
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CheckList;
