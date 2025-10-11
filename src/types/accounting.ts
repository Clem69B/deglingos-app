// Monthly revenue data structure
export interface MonthlyRevenue {
  month: string; // 'YYYY-MM' format
  total: number;
  paymentMethods: {
    CHEQUE: number;
    VIREMENT: number;
    ESPECES: number;
    CARTE_BANCAIRE: number;
  };
  invoiceCount: number;
}

// Revenue analytics interface
export interface RevenueAnalytics {
  monthlyData: MonthlyRevenue[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}
