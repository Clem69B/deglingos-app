'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchUserAttributes, updateMFAPreference, setUpTOTP, verifyTOTPSetup, fetchMFAPreference } from 'aws-amplify/auth';
import QRCode from 'qrcode';
import Image from 'next/image';

interface MFAStatus {
  totpEnabled: boolean;
  preferredMFA?: string;
}

export default function MFASettings() {
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ totpEnabled: false });
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const loadMFAStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const attributes = await fetchUserAttributes();
      setUserEmail(attributes.email || '');

      // Check MFA preference to see if TOTP is enabled
      try {
        const mfaPreference = await fetchMFAPreference();
        const totpEnabled = mfaPreference.preferred === 'TOTP' || mfaPreference.enabled?.includes('TOTP');

        setMfaStatus({
          totpEnabled: totpEnabled || false,
          preferredMFA: mfaPreference.preferred,
        });
      } catch {
        // If MFA preference check fails, assume MFA is not set up
        console.log('MFA not configured for user');
        setMfaStatus({
          totpEnabled: false,
          preferredMFA: undefined,
        });
      }
    } catch (err) {
      console.error('Error loading MFA status:', err);
      setError('Impossible de charger le statut MFA');
    } finally {
      setLoading(false);
    }
  }, [setMfaStatus, setLoading, setError, setUserEmail]);

  const handleSetupTOTP = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const totpSetupDetails = await setUpTOTP();
      const setupUri = totpSetupDetails.getSetupUri('DeglingOS', userEmail);

      setTotpSecret(totpSetupDetails.sharedSecret);

      // Generate QR code
      const qrCode = await QRCode.toDataURL(setupUri.href);
      setQrCodeUrl(qrCode);
      setIsSettingUp(true);
    } catch (err) {
      console.error('Error setting up TOTP:', err);
      setError('Erreur lors de la configuration de l\'authentification à deux facteurs');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Veuillez entrer un code à 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await verifyTOTPSetup({ code: verificationCode });
      await updateMFAPreference({ totp: 'PREFERRED' });

      setSuccess('Authentification à deux facteurs activée avec succès');
      setIsSettingUp(false);
      setQrCodeUrl('');
      setVerificationCode('');
      await loadMFAStatus();
    } catch (err) {
      console.error('Error verifying TOTP:', err);
      setError('Code de vérification invalide. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisableTOTP = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver l\'authentification à deux facteurs ?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await updateMFAPreference({ totp: 'DISABLED' });

      setSuccess('Authentification à deux facteurs désactivée');
      await loadMFAStatus();
    } catch (err) {
      console.error('Error disabling TOTP:', err);
      setError('Erreur lors de la désactivation de l\'authentification à deux facteurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSetup = () => {
    setIsSettingUp(false);
    setQrCodeUrl('');
    setVerificationCode('');
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    loadMFAStatus();
  }, [loadMFAStatus]);

  if (loading && !isSettingUp) {
    return (
      <div className="text-center py-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
        <p className="mt-2 text-sm text-gray-600">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="card-title">
          Authentification à deux facteurs (MFA)
        </h3>
        <p className="card-subtitle">
          Renforcez la sécurité de votre compte en activant l&apos;authentification à deux facteurs.
          Nous recommandons l&apos;utilisation d&apos;une application d&apos;authentification (TOTP).
        </p>
      </div>

      {/* Success message */}
      {success && (
        <div className="alert-success">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="alert-icon-success" />
            </div>
            <div className="ml-3">
              <p className="alert-text-success">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="alert-error">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="alert-icon-error" />
            </div>
            <div className="ml-3">
              <p className="alert-text-error">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!isSettingUp ? (
        <div className="filter-card">
          <div className="filter-card-content">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {mfaStatus.totpEnabled ? (
                  <>
                    <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Authentification à deux facteurs activée
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Votre compte est protégé par TOTP
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShieldExclamationIcon className="h-6 w-6 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Authentification à deux facteurs désactivée
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Activez MFA pour renforcer la sécurité de votre compte
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div>
                {mfaStatus.totpEnabled ? (
                  <button
                    type="button"
                    onClick={handleDisableTOTP}
                    disabled={loading}
                    className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Désactiver
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSetupTOTP}
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Activer MFA
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="filter-card">
          <div className="filter-card-content">
            <h4 className="card-title mb-4">
              Configuration de l&apos;authentification à deux facteurs
            </h4>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Étape 1:</span> Scannez ce QR code avec votre application d&apos;authentification
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Applications recommandées: Google Authenticator, Microsoft Authenticator, Authy
                </p>
                {qrCodeUrl && (
                  <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
                    <Image src={qrCodeUrl} alt="QR Code" width={256} height={256} />
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-700 mb-2">
                  <span className="font-medium">Code secret (si vous ne pouvez pas scanner):</span>
                </p>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <code className="text-sm font-mono break-all">{totpSecret}</code>
                </div>
              </div>

              <div>
                <p className="form-label">
                  <span className="font-medium">Étape 2:</span> Entrez le code à 6 chiffres généré par l&apos;application
                </p>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setVerificationCode(value);
                    setError(null);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="form-input max-w-xs text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleVerifyTOTP}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Vérification...' : 'Vérifier et activer'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelSetup}
                  disabled={loading}
                  className="flex-1 btn-secondary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="alert-info">
        <div className="flex">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="alert-icon-info" />
          </div>
          <div className="ml-3">
            <h4 className="alert-text-info">À propos de l&apos;authentification à deux facteurs</h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>L&apos;authentification TOTP utilise une application sur votre téléphone</li>
                <li>Un nouveau code est généré toutes les 30 secondes</li>
                <li>Vous aurez besoin de ce code à chaque connexion</li>
                <li>Gardez votre téléphone à portée de main lors de la connexion</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon components
function CheckCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function XCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function ShieldExclamationIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
    </svg>
  );
}

function InformationCircleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}
