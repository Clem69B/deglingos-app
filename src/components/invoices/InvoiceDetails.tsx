'use client';

import React from 'react';
import type { Invoice } from '@/types/invoice';
import Link from 'next/link';
import EditableField from '../EditableField';

interface InvoiceDetailsProps {
  invoice: Invoice;
  updateField: (fieldName: string, value: any) => Promise<void>;
  togglePaidStatus: () => Promise<void>;
  isUpdatingStatus: boolean;
}

const InvoiceDetails = ({ invoice, updateField, togglePaidStatus, isUpdatingStatus }: InvoiceDetailsProps) => {
  
  const handleUpdate = async (entityId: string, fieldName: string, value: any) => {
    try {
      await updateField(fieldName, value);
    } catch (error) {
      // The error is handled in the parent component, but we could add local feedback if needed
      console.error(`Failed to update ${fieldName}`, error);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Facture #{invoice.invoiceNumber}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Détails de la facturation et informations sur le patient.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={togglePaidStatus}
          disabled={isUpdatingStatus}
        >
          {isUpdatingStatus ? 'Mise à jour...' : (invoice.isPaid ? 'Marquer comme non payée' : 'Marquer comme payée')}
        </button>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200 grid grid-cols-1 sm:grid-cols-2">
          
          <div className="py-4 sm:py-5 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Patient</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {invoice.patient ? (
                <Link href={`/patients/${invoice.patient.id}`} className="link link-primary">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                </Link>
              ) : 'N/A'}
            </dd>
          </div>

          {invoice.consultation && invoice.consultation.id && (
            <div className="py-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Consultation liée</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <Link href={`/consultations/${invoice.consultation.id}`} className="link link-primary">
                  Consultation du {new Date(invoice.consultation.date).toLocaleDateString('fr-FR')}
                </Link>
              </dd>
            </div>
          )}

          <div className="py-4 sm:py-5 sm:px-6">
            <EditableField
              label="Date de facturation"
              value={invoice.date}
              fieldName="date"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="date"
              required
            />
          </div>

          <div className="py-4 sm:py-5 sm:px-6">
             <EditableField
              label="Statut"
              value={invoice.status}
              fieldName="status"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="select"
              options={[
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'SENT', label: 'Envoyée' },
                { value: 'PAID', label: 'Payée' },
                { value: 'OVERDUE', label: 'En retard' },
              ]}
            />
          </div>

          <div className="py-4 sm:py-5 sm:px-6">
            <EditableField
              label="Total TTC (€)"
              value={invoice.total}
              fieldName="total"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="number"
            />
          </div>

          <div className="py-4 sm:py-5 sm:px-6">
            <EditableField
              label="Méthode de paiement"
              value={invoice.paymentMethod}
              fieldName="paymentMethod"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="select"
              options={[
                { value: 'CHEQUE', label: 'Chèque' },
                { value: 'VIREMENT', label: 'Virement' },
                { value: 'ESPECES', label: 'Espèces' },
                { value: 'CARTE_BANCAIRE', label: 'Carte Bancaire' },
              ]}
            />
          </div>

          <div className="py-4 sm:py-5 sm:px-6">
            <EditableField
              label="Référence de paiement"
              value={invoice.paymentReference}
              fieldName="paymentReference"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="text"
              placeholder="N° de chèque, référence virement..."
            />
          </div>

          <div className="py-4 sm:py-5 sm:px-6 sm:col-span-2">
            <EditableField
              label="Notes"
              value={invoice.notes}
              fieldName="notes"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="textarea"
              placeholder="Ajouter des notes..."
            />
          </div>
        </dl>
      </div>
    </div>
  );
};

export default InvoiceDetails;
