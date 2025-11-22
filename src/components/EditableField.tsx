import React, { useState, useEffect, useRef } from 'react';

// Icône de validation (coche verte)
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-green-500 hover:text-green-700"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

// Icône d'annulation (croix rouge)
const CancelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-red-500 hover:text-red-700"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface EditableFieldProps {
  label: string;
  value: string | number | undefined | null;
  fieldName: string;
  entityId: string;
  updateFunction: (entityId: string, fieldName: string, newValue: string | number | boolean | null | undefined) => Promise<void>;
  inputType?: 'text' | 'textarea' | 'date' | 'email' | 'tel' | 'select' | 'number' | 'datetime-local'; // Ajout de 'datetime-local'
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validationRules?: (value: string | number | boolean | null | undefined) => string | null;
  className?: string;
  inputClassName?: string;
  displayClassName?: string;
  required?: boolean;
  disabled?: boolean;
  onDirtyStateChange?: (fieldName: string, isDirty: boolean) => void;
  displayFormatFunction?: (value: string | number | undefined | null) => string; // Nouvelle prop
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  fieldName,
  entityId,
  updateFunction,
  inputType = 'text',
  placeholder,
  options,
  validationRules,
  className,
  inputClassName,
  displayClassName,
  required = false,
  disabled = false,
  onDirtyStateChange,
  displayFormatFunction, // Récupérer la nouvelle prop
}) => {
  const [isEditingField, setIsEditingField] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [initialValue, setInitialValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Move cursor to end when entering edit mode
  useEffect(() => {
    if (isEditingField && inputRef.current) {
      const element = inputRef.current;
      // Focus the element first
      element.focus();

      // setSelectionRange only works on text-based inputs (not date, datetime-local, etc.)
      const textBasedInputTypes = ['text', 'email', 'tel', 'number'];
      const isTextBased = element.tagName === 'TEXTAREA' ||
        (element.tagName === 'INPUT' && textBasedInputTypes.includes((element as HTMLInputElement).type));

      if (isTextBased) {
        // Move cursor to the end for text-based inputs
        const length = element.value.length;
        try {
          element.setSelectionRange(length, length);
        } catch (e) {
          // Silently ignore if setSelectionRange is not supported
          console.debug('setSelectionRange not supported for this input type', e);
        }
      }

      // For textareas, also scroll to the end and auto-resize
      if (element.tagName === 'TEXTAREA') {
        const textarea = element as HTMLTextAreaElement;
        textarea.scrollTop = textarea.scrollHeight;
        // Auto-resize on mount
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }
  }, [isEditingField]);

  useEffect(() => {
    setCurrentValue(value);
    setInitialValue(value);
  }, [value]);


  useEffect(() => {
    // Gérer l'état dirty lorsque isEditingField change
    if (onDirtyStateChange) {
      if (isEditingField) {
        // Quand on entre en mode édition, l'état dirty dépend de si la valeur actuelle est différente de l'initiale
        onDirtyStateChange(fieldName, currentValue !== initialValue);
      } else {
        // Quand on quitte le mode édition, le champ n'est plus dirty (car sauvegardé ou annulé)
        onDirtyStateChange(fieldName, false);
      }
    }
  }, [isEditingField, currentValue, initialValue, fieldName, onDirtyStateChange]);


  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    if (fieldError) {
      setFieldError(null);
    }
    if (onDirtyStateChange) {
      onDirtyStateChange(fieldName, newValue !== initialValue);
    }

    // Auto-resize textarea
    if (e.target.tagName === 'TEXTAREA') {
      const textarea = e.target as HTMLTextAreaElement;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const saveChanges = async () => {
    if (validationRules) {
      const error = validationRules(currentValue);
      if (error) {
        setFieldError(error);
        return;
      }
    }

    if (currentValue === initialValue) {
      setIsEditingField(false);
      setFieldError(null);
      // onDirtyStateChange(fieldName, false) sera appelé par le useEffect sur isEditingField
      return;
    }

    setIsLoading(true);
    setFieldError(null);
    try {
      await updateFunction(entityId, fieldName, currentValue);
      setInitialValue(currentValue);
      setIsEditingField(false); // Déclenchera le useEffect pour onDirtyStateChange(fieldName, false)
    } catch (err: unknown) {
      console.error(`Error updating field ${fieldName}:`, err);
      if (err instanceof Error) {
        setFieldError(err.message || 'Erreur de sauvegarde');
      } else {
        setFieldError('Une erreur inconnue est survenue lors de la sauvegarde.');
      }
      // En cas d'erreur, le champ reste "dirty" et en mode édition
      if (onDirtyStateChange) {
        onDirtyStateChange(fieldName, true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setCurrentValue(initialValue);
    setIsEditingField(false); // Déclenchera le useEffect pour onDirtyStateChange(fieldName, false)
    setFieldError(null);
  };

  const handleBlur = () => {
    // On ne sauvegarde plus automatiquement au blur pour permettre l'utilisation des boutons Check/Cancel
    // et pour éviter des sauvegardes non désirées si l'utilisateur clique ailleurs accidentellement.
    // L'utilisateur doit explicitement sauvegarder ou annuler.
    // Si on veut un comportement de sauvegarde au blur, il faudrait une logique plus complexe
    // pour gérer le focus et les clics sur les boutons de sauvegarde/annulation.
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Ctrl + Enter to save (works for all input types including textarea)
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveChanges();
    }
    // Enter to save (only for non-textarea inputs)
    else if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault();
      saveChanges();
    }
    // Escape to cancel
    else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const renderInputField = () => {
    const commonProps = {
      id: fieldName,
      name: fieldName,
      onChange: handleValueChange,
      onBlur: handleBlur,
      className: `block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${fieldError ? 'border-red-500' : ''} ${inputClassName || ''} flex-grow`,
      placeholder: placeholder,
      'aria-invalid': !!fieldError,
      'aria-describedby': fieldError ? `${fieldName}-error` : undefined,
    };

    // Format value for datetime-local
    const formattedValue = (() => {
      if (inputType === 'datetime-local' && typeof currentValue === 'string' && currentValue) {
        try {
          const dateObj = new Date(currentValue);
          const year = dateObj.getFullYear();
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const day = dateObj.getDate().toString().padStart(2, '0');
          const hours = dateObj.getHours().toString().padStart(2, '0');
          const minutes = dateObj.getMinutes().toString().padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch (e) {
          console.error('Error formatting date for datetime-local input:', e);
          return currentValue;
        }
      }
      return currentValue || '';
    })();

    let fieldElement;
    if (inputType === 'textarea') {
      fieldElement = (
        <textarea
          {...commonProps}
          onKeyDown={handleKeyDown}
          value={formattedValue}
          rows={3}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={`${commonProps.className} overflow-hidden`}
          style={{ resize: 'none' }}
        />
      );
    } else if (inputType === 'select') {
      fieldElement = (
        <select {...commonProps} value={formattedValue}>
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    } else {
      fieldElement = (
        <input
          type={inputType}
          {...commonProps}
          onKeyDown={handleKeyDown}
          value={formattedValue}
          ref={inputRef as React.RefObject<HTMLInputElement>}
        />
      );
    }

    return (
      <div className={`mt-1 relative flex ${inputType === 'textarea' ? 'items-start' : 'items-center'}`}>
        {fieldElement}
        <div className={`flex-shrink-0 flex items-center ${inputType === 'textarea' ? 'mt-1' : ''}`}>
          <button
            type="button"
            onClick={saveChanges}
            className="ml-1 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            aria-label="Sauvegarder les modifications"
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="ml-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            aria-label="Annuler les modifications"
          >
            <CancelIcon />
          </button>

        </div>
      </div>
    );
  };

  return (
    <div className={`editable-field-container ${className || ''}`}>
      <label htmlFor={fieldName} className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isEditingField ? (
        renderInputField()
      ) : (
        <div
          onClick={() => !disabled && setIsEditingField(true)}
          className={`group mt-1 text-sm text-gray-900 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'} p-2 border border-transparent ${disabled ? '' : 'hover:border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500'} rounded-md min-h-[38px] flex items-center justify-between ${displayClassName || ''}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setIsEditingField(true); } }}
        >
          <span className="whitespace-pre-wrap break-words flex-grow">
            {(() => {
              // 1) If a display formatter is provided, always prefer it
              if (displayFormatFunction) {
                return displayFormatFunction(currentValue ?? null);
              }
              // 2) For select fields, map stored value to its label
              if (inputType === 'select' && options && options.length) {
                const currentStr = (currentValue ?? '').toString();
                const match = options.find(opt => opt.value === currentStr);
                if (match) return match.label;
                // Fallback to raw value if not found
                return currentStr || <span className="text-gray-400 italic">{placeholder || 'Non renseigné'}</span>;
              }
              // 3) Generic fallback
              return currentValue || <span className="text-gray-400 italic">{placeholder || 'Non renseigné'}</span>;
            })()}
          </span>
          {/* L'icône de modification (crayon) n'est plus affichée ici, le clic sur la zone suffit */}
        </div>
      )}
      {isLoading && <p className="mt-1 text-xs text-indigo-600">Sauvegarde...</p>}
      {fieldError && (
        <p id={`${fieldName}-error`} className="mt-1 text-sm text-red-600">{fieldError}</p>
      )}
    </div>
  );
};

export default EditableField;
