'use client';

import { useUserPermissions } from '../../hooks/useUserPermissions';

export default function AccountingPage() {
  const { hasAnyGroup, loading: permissionsLoading } = useUserPermissions();
  const canViewAccounting = hasAnyGroup(['osteopaths', 'assistants', 'admins']);

  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-sm text-gray-600">Chargement des permissions...</span>
      </div>
    );
  }

  if (!canViewAccounting) {
    return (
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
            d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Accès non autorisé</h3>
        <p className="empty-state-text">
          Vous n&apos;avez pas les permissions nécessaires pour voir cette section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="page-title">Tableau de bord comptabilité</h1>
          <p className="page-subtitle">
            Suivez vos revenus, gérez vos chèques et analysez votre activité financière
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Full width top */}
        <div className="lg:col-span-3">
          <div className="form-card h-64">
            <div className="card-header">
              <h3 className="card-title">Revenus (6 derniers mois)</h3>
              <div className="card-subtitle">
                En cours de développement
              </div>
            </div>
            <div className="flex items-center justify-center h-40 bg-gray-50 rounded-lg">
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
                <p className="empty-state-text">Graphique des revenus à venir</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Monthly Summary - Left */}
        <div className="lg:col-span-1">
          <div className="form-card">
            <div className="card-header">
              <h3 className="card-title">Résumé mensuel</h3>
            </div>
            <div className="space-y-4">
              <div className="empty-state">
                <svg 
                  className="mx-auto h-10 w-10 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={1.5} 
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                  />
                </svg>
                <p className="empty-state-text">Statistiques mensuelles à venir</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Check Tracker - Right */}
        <div className="lg:col-span-2">
          <div className="form-card">
            <div className="card-header">
              <h3 className="card-title">Chèques non encaissés</h3>
              <div className="card-subtitle">
                0 chèque en attente
              </div>
            </div>
            <div className="empty-state">
              <svg 
                className="mx-auto h-10 w-10 text-gray-400" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth={1.5} 
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
              </svg>
              <p className="empty-state-text">Suivi des chèques à venir</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}