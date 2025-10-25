'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import PatientCombobox from '../PatientCombobox';
import type { CreateInvoiceInput } from '../../types/invoice';
import useInvoiceManagement from '../../hooks/useInvoiceManagement';
import { useUserProfile } from '../../hooks/useUserProfile';

const client = generateClient<Schema>();

interface InvoiceFormProps {
  consultationId?: string | null;
  patientId?: string | null;
  onError: (error: string) => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ consultationId, patientId, onError }) => {
  const router = useRouter();
  const { createInvoice, loading: isSubmitting } = useInvoiceManagement({ onError });
  const { fetchCurrentUserProfile } = useUserProfile();
  const [selectedPatient, setSelectedPatient] = useState<{ firstName: string; lastName: string } | null>(null);
  const [defaultPrice, setDefaultPrice] = useState<number>(55); // Fallback default price
  
  const [formData, setFormData] = useState<Partial<CreateInvoiceInput>>({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0], // Default to today
    dueDate: '',
    price: 55, // Will be updated from user profile
    status: 'DRAFT', // Status is always DRAFT on creation
    paymentMethod: 'BANK_TRANSFER',
    notes: '',
    patientId: '',
    consultationId: null,
  });

  // Load user's default consultation price
  useEffect(() => {
    const loadDefaultPrice = async () => {
      const profile = await fetchCurrentUserProfile();
      if (profile?.defaultConsultationPrice) {
        setDefaultPrice(profile.defaultConsultationPrice);
        setFormData(prev => ({ ...prev, price: profile.defaultConsultationPrice }));
      }
    };
    loadDefaultPrice();
  }, [fetchCurrentUserProfile]);

  useEffect(() => {
    if (patientId) {
      setFormData(prev => ({ ...prev, patientId }));
    }
    if (consultationId) {
      setFormData(prev => ({ ...prev, consultationId }));
    }
  }, [patientId, consultationId]);

  useEffect(() => {
    if (formData.date) {
      const billingDate = new Date(formData.date);
      billingDate.setDate(billingDate.getDate() + 2); // Add 48 hours
      const newDueDate = billingDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, dueDate: newDueDate }));
    }
  }, [formData.date]);

  const generateInvoiceNumber = useCallback(() => {
    if (selectedPatient && formData.date) {
      const date = new Date(formData.date);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const patientLastName = selectedPatient.lastName.toUpperCase().replace(/[^A-Z]/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `FACT-${year}${month}-${patientLastName}-${randomSuffix}`;
    }
    return '';
  }, [selectedPatient, formData.date]);

  useEffect(() => {
    if (formData.patientId) {
      const fetchPatient = async () => {
        const { data: patientData } = await client.models.Patient.get({ id: formData.patientId! });
        if (patientData) {
          setSelectedPatient(patientData);
        }
      };
      fetchPatient();
    } else {
      setSelectedPatient(null);
    }
  }, [formData.patientId]);

  useEffect(() => {
    const newInvoiceNumber = generateInvoiceNumber();
    if (newInvoiceNumber) {
      setFormData(prev => ({ ...prev, invoiceNumber: newInvoiceNumber }));
    }
  }, [selectedPatient, formData.date, generateInvoiceNumber]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | null = value;
    if (type === 'number') {
      processedValue = value === '' ? null : parseFloat(value);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handlePatientSelect = (selectedPatientId: string) => {
    setFormData(prev => ({ ...prev, patientId: selectedPatientId }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.patientId || !formData.invoiceNumber || !formData.date) {
      if (typeof onError === 'function') {
        onError('Veuillez remplir tous les champs requis (Patient, Numéro de facture, Date).');
      }
      return;
    }
    if (typeof onError === 'function') {
      onError(''); // Clear error
    }

    const input: CreateInvoiceInput = {
      patientId: formData.patientId,
      invoiceNumber: formData.invoiceNumber,
      date: formData.date,
      consultationId: formData.consultationId,
      dueDate: formData.dueDate || null,
      price: formData.price || 0,
      total: formData.price || 0, // Total is the same as price
      status: formData.status || 'DRAFT',
  paymentMethod: formData.paymentMethod || 'BANK_TRANSFER',
      notes: formData.notes || null,
      isPaid: formData.status === 'PAID',
      paidAt: formData.status === 'PAID' ? new Date().toISOString() : null,
    };

    const newInvoice = await createInvoice(input);

    if (newInvoice) {
      router.push(`/invoices/${newInvoice.id}?created=true`);
    }
    // Error handling is managed by the hook and displayed by the ErrorAlert component
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 form-card">
      <div className="space-y-4">
        <h2 className="page-title">Nouvelle Facture</h2>
        <p className="text-sm text-gray-500">
          {consultationId ? "Création d'une facture pour une consultation existante." : "Création d'une nouvelle facture manuelle."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="patientId" className="form-label">
            Patient
          </label>
          <div className="mt-1">
            <PatientCombobox
              value={formData.patientId || ''}
              onChange={handlePatientSelect}
              disabled={!!patientId} // Disable if patientId is passed from props
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="invoiceNumber" className="form-label">
            Numéro de facture (généré automatiquement)
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="invoiceNumber"
              id="invoiceNumber"
              value={formData.invoiceNumber}
              readOnly
              className="form-input form-input-readonly"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="date" className="form-label">
            Date de facturation
          </label>
          <div className="mt-1">
            <input
              type="date"
              name="date"
              id="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="price" className="form-label">
            Montant
          </label>
          <div className="mt-1">
            <input
              type="number"
              name="price"
              id="price"
              value={formData.price || ''}
              onChange={handleChange}
              step="0.01"
              className="form-input"
              required
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="paymentMethod" className="form-label">
            Moyen de paiement
          </label>
          <div className="mt-1">
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod || ''}
              onChange={handleChange}
              className="form-input"
            >
              <option value="BANK_TRANSFER">Virement</option>
              <option value="CHECK">Chèque</option>
              <option value="CASH">Espèces</option>
              <option value="CARD">Carte Bancaire</option>
            </select>
          </div>
        </div>

        <div className="sm:col-span-6">
          <label htmlFor="notes" className="form-label">
            Notes
          </label>
          <div className="mt-1">
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="pt-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="ml-3 btn btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default InvoiceForm;
