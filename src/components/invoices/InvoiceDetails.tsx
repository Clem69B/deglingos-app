'use client';

import React from 'react';
import type { Invoice } from '@/types/invoice';
import Link from 'next/link';
import EditableField from '../EditableField';

interface InvoiceDetailsProps {
  invoice: Invoice;
  updateField: (fieldName: string, value: any) => Promise<void>;
  markAsPending: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  unmarkAsPaid: (id: string) => Promise<void>;
  sendInvoiceEmail: (id: string) => Promise<boolean>;
  isUpdatingStatus: boolean;
  isSendingEmail: boolean;
}

const InvoiceDetails = ({
  invoice,
  updateField,
  markAsPending,
  markAsPaid,
  unmarkAsPaid,
  sendInvoiceEmail,
  isUpdatingStatus,
}: InvoiceDetailsProps) => {
  
  const handleUpdate = async (entityId: string, fieldName: string, value: any) => {
    try {
      await updateField(fieldName, value);
    } catch (error) {
      console.error(`Failed to update ${fieldName}`, error);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'badge-success';
      case 'PENDING':
        return 'badge-info';
      case 'OVERDUE':
        return 'badge-error';
      case 'DRAFT':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Payée';
      case 'PENDING':
        return 'En attente de paiement';
      case 'OVERDUE':
        return 'En retard';
      case 'DRAFT':
        return 'Brouillon';
      default:
        return status;
    }
  };

  const onMarkPending = async () => {
    try {
      await markAsPending(invoice.id);
    } catch (err) {
      console.error('Failed to mark as pending', err);
    }
  };

  const onTogglePaid = async () => {
    try {
      if (invoice.isPaid) {
        await unmarkAsPaid(invoice.id);
      } else {
        await markAsPaid(invoice.id);
      }
    } catch (err) {
      console.error('Failed to toggle paid', err);
    }
  };

  const onSendEmail = async () => {
    try {
      await sendInvoiceEmail(invoice.id);
    } catch (err) {
      console.error('Failed to send invoice email', err);
    }
  };

  return (
    <div className="form-card overflow-hidden">
      <div className="detail-header">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Facture #{invoice.invoiceNumber}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Détails de la facturation et informations sur le patient.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge ${getStatusBadgeColor(invoice.status || 'DRAFT')}`}>
            {translateStatus(invoice.status || 'DRAFT')}
          </span>

          <div className="flex items-center gap-2">
            {/* Send (mark pending) visible when DRAFT */}
            {invoice.status === 'DRAFT' && (
              <button
                className="btn btn-secondary"
                onClick={onMarkPending}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Mise à jour...' : 'Facture en attente'}
              </button>
            )}

            {/* Send email (does not change status) */}
            <button
              className="btn btn-secondary"
              onClick={onSendEmail}
            >
              Envoyé par email
            </button>

            {/* Paid/unpaid toggle */}
            <button 
              className="btn btn-primary"
              onClick={onTogglePaid}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Mise à jour...' : (invoice.isPaid ? 'Marquer comme non payée' : 'Marquer comme payée')}
            </button>
          </div>
        </div>
      </div>
      <div className="detail-content">
        <dl className="sm:divide-y sm:divide-gray-200 grid grid-cols-1 sm:grid-cols-2">
          
          <div className="detail-section">
            <dt className="detail-label">Patient</dt>
            <dd className="detail-value">
              {invoice.patient ? (
                <Link href={`/patients/${invoice.patient.id}`} className="link link-primary">
                  {invoice.patient.firstName} {invoice.patient.lastName}
                </Link>
              ) : 'N/A'}
            </dd>
          </div>

          {invoice.consultation && invoice.consultation.id && (
            <div className="detail-section">
              <dt className="detail-label">Consultation liée</dt>
              <dd className="detail-value">
                <Link href={`/consultations/${invoice.consultation.id}`} className="link link-primary">
                  Consultation du {new Date(invoice.consultation.date).toLocaleDateString('fr-FR')}
                </Link>
              </dd>
            </div>
          )}

          <div className="detail-section">
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

          <div className="detail-section">
            <dt className="detail-label">Statut</dt>
            <dd className="detail-value">
              <div className="flex items-center gap-2">
                <span>{translateStatus(invoice.status || 'DRAFT')}</span>
              </div>
            </dd>
          </div>

          <div className="detail-section">
            <EditableField
              label="Total TTC (€)"
              value={invoice.total}
              fieldName="total"
              entityId={invoice.id}
              updateFunction={handleUpdate}
              inputType="number"
            />
          </div>

          <div className="detail-section">
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

          <div className="detail-section">
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

          <div className="detail-section sm:col-span-2">
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
