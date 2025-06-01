'use client';

export default function InvoicesPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Facturation</h3>
          <p className="mt-1 text-sm text-gray-500">
            Cette section permettra de gérer la facturation et les paiements.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Factures</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Créer une facture</li>
                  <li>• Liste des factures</li>
                  <li>• Factures impayées</li>
                  <li>• Relances automatiques</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Paiements</h4>
                <ul className="mt-2 text-sm text-green-700 space-y-1">
                  <li>• Enregistrer un paiement</li>
                  <li>• Historique des paiements</li>
                  <li>• Modes de paiement</li>
                  <li>• Remboursements</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900">Statistiques</h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• Chiffre d&apos;affaires</li>
                  <li>• Revenus par mois</li>
                  <li>• Taux d&apos;impayés</li>
                  <li>• Graphiques</li>
                </ul>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900">Paramètres</h4>
                <ul className="mt-2 text-sm text-purple-700 space-y-1">
                  <li>• Tarifs par acte</li>
                  <li>• TVA et taxes</li>
                  <li>• Modèles de facture</li>
                  <li>• Conditions de paiement</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Aperçu des données</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">€0</div>
                  <div className="text-sm text-gray-600">Revenus ce mois</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">0</div>
                  <div className="text-sm text-gray-600">Factures impayées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Factures payées</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
