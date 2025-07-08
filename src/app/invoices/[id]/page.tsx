'use client';

import React from 'react';
import InvoiceDetails from '@/components/invoices/InvoiceDetails';

const InvoiceDetailPage = ({ params }: { params: { id: string } }) => {
  return (
    <div>
      <InvoiceDetails />
    </div>
  );
};

export default InvoiceDetailPage;
