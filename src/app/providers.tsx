'use client';

import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import '../lib/amplify';
import { DirtyFormProvider } from '../contexts/DirtyFormContext';
import { useUserCache } from '../hooks/useUserCache';
import { useEffect, useRef } from 'react';

// Composant wrapper qui gère le nettoyage du cache lors de chaque authentification réussie
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const { clearCache } = useUserCache();
  const hasAuthenticatedRef = useRef(false);

  useEffect(() => {
    // Si l'utilisateur vient de se connecter avec succès
    if (authStatus === 'authenticated' && !hasAuthenticatedRef.current) {
      console.log('Authentification réussie, nettoyage du cache utilisateur');
      clearCache();
      hasAuthenticatedRef.current = true;
    }
    
    // Reset le flag quand l'utilisateur se déconnecte
    if (authStatus !== 'authenticated') {
      hasAuthenticatedRef.current = false;
    }
  }, [authStatus, clearCache]);

  return <>{children}</>;
}

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
          <AuthWrapper>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </AuthWrapper>
        </DirtyFormProvider>
      )}
    </Authenticator>
  );
}
