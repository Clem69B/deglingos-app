'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InvoiceForm from '@/components/invoices/InvoiceForm';

// A wrapper component is needed to use useSearchParams,
// as it must be used within a Suspense boundary.
const NewInvoiceFormWrapper = () => {
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const patientId = searchParams.get('patientId');

  return <InvoiceForm consultationId={consultationId} patientId={patientId} />;
};

const NewInvoicePage = () => {
  return (
    <div>
      <Suspense fallback={<div>Chargement du formulaire...</div>}>
        <NewInvoiceFormWrapper />
      </Suspense>
    </div>
  );
};

export default NewInvoicePage;
