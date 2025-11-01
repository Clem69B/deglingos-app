// Monthly revenue data structure
export interface MonthlyRevenue {
  month: string; // 'YYYY-MM' format
  total: number;
  paymentMethods: {
    CHECK: number;
    BANK_TRANSFER: number;
    CASH: number;
    CARD: number;
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
