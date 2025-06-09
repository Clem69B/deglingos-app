'use client';

import { useState, useCallback } from 'react';

export interface ErrorWithType {
  /** Le message ou l'objet d'erreur */
  error: string | Error | Array<{ message: string }>;
  /** Le type d'erreur */
  type: 'error' | 'warning' | 'info';
}

export interface UseErrorHandlerReturn {
  /** L'erreur actuelle */
  error: string | Error | Array<{ message: string }> | null;
  /** Le type d'erreur actuel */
  errorType: 'error' | 'warning' | 'info';
  /** Fonction pour définir une erreur avec son type */
  setError: (error: string | Error | Array<{ message: string }> | null, type?: 'error' | 'warning' | 'info') => void;
  /** Fonction pour effacer l'erreur */
  clearError: () => void;
  /** Fonction helper pour gérer les erreurs des réponses Amplify */
  handleAmplifyResponse: <T>(response: { data: T; errors?: Array<{ message: string }> }) => T | null;
  /** Indique s'il y a une erreur */
  hasError: boolean;
}

/**
 * Hook personnalisé pour gérer les erreurs de manière cohérente
 */
export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<string | Error | Array<{ message: string }> | null>(null);
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info'>('error');

  const setError = useCallback((newError: string | Error | Array<{ message: string }> | null, type: 'error' | 'warning' | 'info' = 'error') => {
    setErrorState(newError);
    setErrorType(type);
  }, []);

  const clearError = useCallback(() => {
    setErrorState(null);
    setErrorType('error'); // Reset to default
  }, []);

  const handleAmplifyResponse = useCallback(<T>(
    response: { data: T; errors?: Array<{ message: string }> }
  ): T | null => {
    if (response.errors && response.errors.length > 0) {
      setError(response.errors);
      return null;
    }
    
    clearError();
    return response.data;
  }, [clearError, setError]);

  return {
    error,
    errorType,
    setError,
    clearError,
    handleAmplifyResponse,
    hasError: error !== null
  };
}

/**
 * Hook pour gérer les erreurs avec try/catch automatique
 */
export function useAsyncErrorHandler() {
  const { error, errorType, setError, clearError, hasError } = useErrorHandler();

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    try {
      clearError();
      const result = await asyncFn();
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      return null;
    }
  }, [clearError, setError]);

  return {
    error,
    errorType,
    setError,
    clearError,
    hasError,
    executeAsync
  };
}
