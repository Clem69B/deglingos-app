'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../lib/amplify';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      signUpAttributes={['given_name', 'family_name']}
      loginMechanisms={['email']}
    >
      {({ signOut, user }) => (
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <h1 className="text-xl font-semibold">Cabinet Ostéopathie</h1>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Bonjour, {user?.signInDetails?.loginId}
                  </span>
                  <button
                    onClick={signOut}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      )}
    </Authenticator>
  );
}