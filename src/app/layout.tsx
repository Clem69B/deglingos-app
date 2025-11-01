import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import Navigation from '../components/Navigation';
import VersionInfo from '../components/VersionInfo';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeglingOs - Cabinet Ostéopathie - Gestion',
  description: 'Application de gestion pour cabinet d\'ostéopathie',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <Providers>
          <Navigation />
          <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  © 2025 DeglingOs. Tous droits réservés.
                </p>
                <VersionInfo showDetails={true} />
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
