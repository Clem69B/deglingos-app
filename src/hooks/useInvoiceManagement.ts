'use client';

import { useState } from 'react';

const useInvoiceManagement = () => {
  // State for handling errors
  const [error, setError] = useState<string | null>(null);
  // State for loading status
  const [loading, setLoading] = useState(false);

  return {
    error,
    loading,
    // Functions to create, read, update, delete invoices will be added here
  };
};

export default useInvoiceManagement;
