'use client';

import Link, { LinkProps } from 'next/link';
import React, { MouseEventHandler } from 'react';

/* 
* ProtectedLink
* Component that wraps Next.js Link to provide a confirmation dialog
* when the user tries to navigate away with unsaved changes.
* It accepts a `isDirty` prop to determine if there are unsaved changes,
* and a `confirmMessage` prop to customize the confirmation dialog.
* It also allows an internal callback `_onClickInternal` to be executed
* if the navigation is confirmed.
*/

interface ProtectedLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  children: React.ReactNode;
  isDirty: boolean;
  confirmMessage?: string;
  disabled?: boolean; // Ajout de la propriété disabled
}

const ProtectedLink: React.FC<ProtectedLinkProps> = ({
  href,
  children,
  isDirty,
  confirmMessage = 'Vous avez des modifications non enregistrées. Êtes-vous sûr de vouloir quitter ?',
  onClick,
  disabled, // Récupérer la propriété disabled
  ...props
}) => {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (disabled) {
      event.preventDefault(); // Empêche la navigation si le lien est désactivé
      return;
    }
    
    if (isDirty) {
      if (!window.confirm(confirmMessage)) {
        event.preventDefault(); // Empêche la navigation
      }
    }

    if (onClick) {
      onClick(event); // Appeler le onClick externe fourni
    }

    // Si event.preventDefault() a été appelé, Next.js Link ne naviguera pas.
  };

  return (
    <Link href={href} onClick={handleClick} {...props} aria-disabled={disabled} tabIndex={disabled ? -1 : undefined}>
      {children}
    </Link>
  );
};

export default ProtectedLink;
