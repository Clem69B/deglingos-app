'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { MonthlyRevenue } from '@/types/accounting';
import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartProps {
  data: MonthlyRevenue[];
  loading?: boolean;
}

export default function RevenueChart({ data, loading = false }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const labels = data.map(item => {
      const date = parse(item.month, 'yyyy-MM', new Date());
      return format(date, 'MMM yyyy', { locale: fr });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Revenus',
          data: data.map(item => item.total),
          backgroundColor: 'rgba(79, 70, 229, 0.8)', // indigo-600
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: { parsed: { y: number } }) => `${context.parsed.y.toFixed(2)} €`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => `${value} €`,
        },
      },
    },
  }), []);

  const totalRevenue = useMemo(() => {
    return data.reduce((sum, item) => sum + item.total, 0);
  }, [data]);

  if (loading) {
    return (
      <div className="form-card h-64">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600">Chargement des données...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="form-card h-64">
        <div className="card-header">
          <h3 className="card-title">Revenus (6 derniers mois)</h3>
        </div>
        <div className="flex items-center justify-center h-40">
          <div className="empty-state">
            <svg 
              className="mx-auto h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              strokeWidth={1.5} 
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 5 15.814-5.518l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.94"
              />
            </svg>
            <p className="empty-state-text">Aucune donnée de revenus disponible</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card">
      <div className="card-header">
        <h3 className="card-title">Revenus (6 derniers mois)</h3>
      </div>
      
      <div className="h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600 border-t pt-4">
        <span className="font-medium">Total période: </span>
        <span className="font-semibold text-gray-900">{totalRevenue.toFixed(2)} €</span>
      </div>
    </div>
  );
}
