'use client';

export default function AppointmentsPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">Agenda</h3>
          <p className="mt-1 text-sm text-gray-500">
            Cette section permettra de gérer l'agenda et les rendez-vous.
          </p>
          
          <div className="mt-6">
            {/* Mock calendar preview */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h4 className="font-medium text-gray-900 mb-4">Vue du calendrier</h4>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-700 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 6 + 1;
                  const isToday = day === 15;
                  const hasAppointment = [3, 8, 15, 22, 29].includes(day);
                  
                  return (
                    <div
                      key={i}
                      className={`
                        aspect-square flex items-center justify-center text-sm rounded-md
                        ${day <= 0 || day > 31 ? 'text-gray-300' : 'text-gray-700'}
                        ${isToday ? 'bg-indigo-600 text-white font-bold' : ''}
                        ${hasAppointment && !isToday ? 'bg-blue-100 text-blue-800 font-medium' : ''}
                        ${!hasAppointment && !isToday && day > 0 && day <= 31 ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      {day > 0 && day <= 31 ? day : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900">Planning</h4>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Vue calendrier mensuel</li>
                  <li>• Vue agenda quotidien</li>
                  <li>• Vue hebdomadaire</li>
                  <li>• Créneaux disponibles</li>
                </ul>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900">Rendez-vous</h4>
                <ul className="mt-2 text-sm text-green-700 space-y-1">
                  <li>• Nouveau rendez-vous</li>
                  <li>• Modifier un RDV</li>
                  <li>• Annuler un RDV</li>
                  <li>• Rappels automatiques</li>
                </ul>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900">Notifications</h4>
                <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                  <li>• SMS de rappel</li>
                  <li>• Email de confirmation</li>
                  <li>• Notifications push</li>
                  <li>• Confirmations patient</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">RDV aujourd'hui</div>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">RDV cette semaine</div>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Créneaux libres</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
