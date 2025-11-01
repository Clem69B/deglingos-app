import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comptabilité - DeglingOs',
  description: 'Tableau de bord comptabilité - Gestion des revenus et des chèques',
};

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}