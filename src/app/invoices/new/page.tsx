'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import InvoiceForm from '@/components/invoices/InvoiceForm';
import ErrorAlert from '@/components/ErrorAlert';

// A wrapper component is needed to use useSearchParams,
// as it must be used within a Suspense boundary.
const NewInvoiceFormWrapper = () => {
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const patientId = searchParams.get('patientId');
  const [formError, setFormError] = React.useState<string | null>(null);

  return <>
    {formError && <ErrorAlert error={formError} type="error" />}
    <InvoiceForm consultationId={consultationId} patientId={patientId} onError={setFormError} />
  </>;
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
