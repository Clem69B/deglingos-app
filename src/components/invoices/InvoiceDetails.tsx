'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { Invoice } from '@/types/invoice';
import Link from 'next/link';
import EditableField from '../EditableField';
import ErrorAlert from '../ErrorAlert';
import { getStatusBadgeColor, translateStatus } from '@/lib/invoiceStatus';

const EMAIL_COOLDOWN_MS = 5000;

interface InvoiceDetailsProps {
  invoice: Invoice;
  updateField: (fieldName: string, value: unknown) => Promise<void>;
  markAsPending: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  unmarkAsPaid: (id: string) => Promise<void>;
  sendInvoiceEmail: (id: string) => Promise<void>;
  downloadInvoicePDF: (id: string) => Promise<void>;
  isUpdatingStatus: boolean;
}

const InvoiceDetails = ({
  invoice,
  updateField,
  markAsPending,
  markAsPaid,
  unmarkAsPaid,
  sendInvoiceEmail,
  downloadInvoicePDF,
  isUpdatingStatus,
}: InvoiceDetailsProps) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
    };
  }, []);

  const handleUpdate = async (_entityId: string, fieldName: string, value: unknown) => {
    try {
      await updateField(fieldName, value);
    } catch (err) {
      console.error(`Failed to update ${fieldName}`, err);
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
      setIsSendingEmail(true);
      setSuccessMessage(null);
      
      // Clear any existing timeout
      if (emailTimeoutRef.current) {
        clearTimeout(emailTimeoutRef.current);
      }
      
      await sendInvoiceEmail(invoice.id);
      setSuccessMessage('Email envoyé avec succès !');
      
      // Re-enable button after cooldown period
      emailTimeoutRef.current = setTimeout(() => {
        setIsSendingEmail(false);
        emailTimeoutRef.current = null;
      }, EMAIL_COOLDOWN_MS);
    } catch (err) {
      console.error('Failed to send invoice email', err);
      setIsSendingEmail(false);
    }
  };

  const onPrintInvoice = async () => {
    try {
      await downloadInvoicePDF(invoice.id);
    } catch (err) {
      console.error('Failed to download invoice PDF', err);
    }
  };

  return (
    <div className="form-card overflow-hidden">
      {successMessage && (
        <div className="mb-4">
          <ErrorAlert 
            error={successMessage}
            type="info"
            autoClose={true}
            autoCloseDelay={EMAIL_COOLDOWN_MS}
            onClose={() => setSuccessMessage(null)}
          />
        </div>
      )}
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
                className="btn btn-primary"
                onClick={onMarkPending}
                disabled={isUpdatingStatus}
              >
                {isUpdatingStatus ? 'Mise à jour...' : 'Valider la facture'}
              </button>
            )}

            {/* Print button - disabled when DRAFT */}
            {invoice.status !== 'DRAFT' && (<button
              className="btn btn-secondary"
              onClick={onPrintInvoice}
            >
              Impression
            </button>
            )}

            {/* Send email button - disabled when DRAFT or no patient email */}
            {invoice.status !== 'DRAFT' && (<button
              className="btn btn-secondary"
              onClick={onSendEmail}
              disabled={!invoice.patient?.email || isSendingEmail}
            >
              {isSendingEmail ? 'Envoi en cours...' : 'Envoyé par email'}
            </button>
            )}

            {/* Paid/unpaid toggle */}
            {invoice.status !== 'DRAFT' && (<button
              className="btn btn-primary"
              onClick={onTogglePaid}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? 'Mise à jour...' : (invoice.isPaid ? 'Marquer comme non payée' : 'Marquer comme payée')}
            </button>
            )}
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
              disabled={invoice.status === 'PAID'}
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
                { value: 'CHECK', label: 'Chèque' },
                { value: 'BANK_TRANSFER', label: 'Virement' },
                { value: 'CASH', label: 'Espèces' },
                { value: 'CARD', label: 'Carte Bancaire' },
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

          {invoice.paymentMethod === 'CHECK' && (
            <div className="detail-section">
              <dt className="detail-label">Date d&apos;encaissement</dt>
              <dd className="detail-value">
                <div className="flex items-center gap-2">
                  <span>{invoice.depositDate ? new Date(invoice.depositDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                </div>
              </dd>
            </div>
          )}

          {invoice.paymentMethod === 'CHECK' && (
            <div className="detail-section">
              <dt className="detail-label">Chèque déposé</dt>
              <dd className="detail-value">
                <div className="flex items-center gap-2">
                  <span>{translateStatus(invoice.isDeposited ? 'Oui' : 'Non')}</span>
                </div>
              </dd>
            </div>
          )}  

          <div className="detail-section">
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
