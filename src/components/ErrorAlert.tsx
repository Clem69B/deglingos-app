'use client';

import { useEffect, useState } from 'react';

export interface ErrorAlertProps {
  /** L'erreur à afficher - peut être une chaîne, un objet Error, ou un tableau d'erreurs Amplify */
  error: string | Error | Array<{ message: string }> | null | undefined;
  /** Titre personnalisé pour l'erreur */
  title?: string;
  /** Type de l'erreur qui influence le style */
  type?: 'error' | 'warning' | 'info';
  /** Si true, l'alerte se ferme automatiquement après le délai spécifié */
  autoClose?: boolean;
  /** Délai en millisecondes avant fermeture automatique (défaut: 5000ms) */
  autoCloseDelay?: number;
  /** Callback appelé quand l'utilisateur ferme l'alerte */
  onClose?: () => void;
  /** Si true, affiche un bouton de fermeture */
  dismissible?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

export default function ErrorAlert({
  error,
  title,
  type = 'error',
  autoClose = false,
  autoCloseDelay = 5000,
  onClose,
  dismissible = true,
  className = ''
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Fonction pour extraire le message d'erreur
  const getErrorMessage = (error: ErrorAlertProps['error']): string => {
    if (!error) return '';
    
    if (typeof error === 'string') {
      return error;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    if (Array.isArray(error)) {
      return error.map(e => e.message).join(', ');
    }
    
    return 'Une erreur inattendue s\'est produite.';
  };

  // Remettre l'alerte visible quand une nouvelle erreur arrive
  useEffect(() => {
    if (error) {
      setIsVisible(true);
    }
  }, [error]);

  // Gestion de la fermeture automatique
  useEffect(() => {
    if (autoClose && error) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, error]);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  // Ne rien afficher si pas d'erreur ou si fermé
  if (!error || !isVisible) {
    return null;
  }

  const errorMessage = getErrorMessage(error);
  if (!errorMessage) {
    return null;
  }

  // Styles selon le type
  const getStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-400',
          title: 'text-yellow-800',
          message: 'text-yellow-700',
          button: 'text-yellow-500 hover:text-yellow-600'
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-400',
          title: 'text-blue-800',
          message: 'text-blue-700',
          button: 'text-blue-500 hover:text-blue-600'
        };
      default: // error
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-400',
          title: 'text-red-800',
          message: 'text-red-700',
          button: 'text-red-500 hover:text-red-600'
        };
    }
  };

  const styles = getStyles();

  // Icône selon le type
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default: // error
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`rounded-md border p-4 ${styles.container} ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <div className={styles.icon}>
            {getIcon()}
          </div>
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h3 className={`text-sm font-medium ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${title ? 'mt-1' : ''} ${styles.message}`}>
            {errorMessage}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
              >
                <span className="sr-only">Fermer</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
