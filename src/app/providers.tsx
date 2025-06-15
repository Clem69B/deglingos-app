'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../lib/amplify';
import { DirtyFormProvider } from '../contexts/DirtyFormContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Authenticator
      signUpAttributes={['given_name', 'family_name']}
      loginMechanisms={['email']}
      hideSignUp
      components={{
        Header() {
          return (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-600 mb-2">
                Degling&apos;Os
              </h1>
              <p className="text-gray-600">
                Cabinet d&apos;Ostéopathie - Connexion
              </p>
            </div>
          );
        },
        Footer() {
          return (
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                © 2025 Degling&apos;Os - Tous droits réservés
              </p>
            </div>
          );
        }
      }}
      formFields={{
        signIn: {
          username: {
            placeholder: 'Email',
            label: 'Adresse email',
            required: true,
          },
          password: {
            placeholder: 'Mot de passe',
            label: 'Mot de passe',
            required: true,
          },
        },
      }}
    >
      {() => (
        <DirtyFormProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </DirtyFormProvider>
      )}
    </Authenticator>
  );
}