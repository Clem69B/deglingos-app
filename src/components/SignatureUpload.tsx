'use client';

import { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '../hooks/useUserProfile';

interface SignatureUploadProps {
  userId: string;
  currentSignatureKey?: string | null;
  onUploadSuccess?: (key: string) => void;
  onDeleteSuccess?: () => void;
}

export default function SignatureUpload({
  userId,
  currentSignatureKey,
  onUploadSuccess,
  onDeleteSuccess,
}: SignatureUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { uploadSignature, deleteSignature, getSignatureUrl, loading, error } = useUserProfile();

  // Load signature preview
  useEffect(() => {
    const loadPreview = async () => {
      if (currentSignatureKey) {
        const url = await getSignatureUrl(currentSignatureKey);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
    };
    loadPreview();
  }, [currentSignatureKey, getSignatureUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    const result = await uploadSignature(userId, file);
    if (result.success && result.key) {
      onUploadSuccess?.(result.key);
    }
  };

  const handleDelete = async () => {
    if (!currentSignatureKey) return;
    
    if (confirm('Êtes-vous sûr de vouloir supprimer cette signature ?')) {
      const success = await deleteSignature(userId, currentSignatureKey);
      if (success) {
        onDeleteSuccess?.();
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Signature
        </label>
        <p className="text-sm text-gray-500 mb-4">
          Format JPG uniquement, taille maximale 1 MB
        </p>
      </div>

      {/* Preview */}
      {previewUrl ? (
        <div className="relative">
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <img
              src={previewUrl}
              alt="Signature"
              className="max-h-32 mx-auto"
            />
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="mt-2 w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Supprimer la signature
          </button>
        </div>
      ) : (
        /* Upload area */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,image/jpeg"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />
          <UploadIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-1">
            {loading ? 'Téléchargement en cours...' : 'Cliquez ou glissez-déposez votre signature'}
          </p>
          <p className="text-xs text-gray-500">
            JPG uniquement, max 1 MB
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon components
function UploadIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
  );
}

function TrashIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
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
