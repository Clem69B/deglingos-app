import React, { useState, useEffect } from 'react';
import AutoResizeTextarea from './AutoResizeTextarea';

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

  useEffect(() => {
    setCurrentValue(value);
    setInitialValue(value);
    // Si le composant est initialisé et n'est pas en mode édition, il n'est pas "dirty"
    if (onDirtyStateChange && isEditingField) {
        onDirtyStateChange(fieldName, value !== initialValue);
    } else if (onDirtyStateChange && !isEditingField) {
        onDirtyStateChange(fieldName, false);
    }
  }, [value]); // Dépendance à `value` uniquement pour réinitialiser si la prop `value` change de l'extérieur


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
    if (e.key === 'Enter' && inputType !== 'textarea') {
      e.preventDefault();
      saveChanges();
    } else if (e.key === 'Escape') {
      e.preventDefault(); // Empêcher d'autres comportements par défaut si Escape est pressé
      handleCancel();
    }
  };

  const renderInputField = () => {
    const inputElementProps: {
      id: string;
      name: string;
      value: string | number; 
      onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
      onBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
      onKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>; 
      className: string;
      placeholder?: string;
      'aria-invalid': boolean | undefined;
      'aria-describedby': string | undefined;
      autoFocus: boolean;
    } = {
      id: fieldName,
      name: fieldName,
      // Formatage de la valeur pour datetime-local
      value: (() => {
        if (inputType === 'datetime-local' && typeof currentValue === 'string' && currentValue) {
          try {
            const dateObj = new Date(currentValue); // currentValue est une chaîne ISO (UTC)
            // Formatte en YYYY-MM-DDTHH:MM pour l'affichage local dans l'input
            const year = dateObj.getFullYear();
            const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            const hours = dateObj.getHours().toString().padStart(2, '0');
            const minutes = dateObj.getMinutes().toString().padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
          } catch (e) {
            console.error('Error formatting date for datetime-local input:', e);
            return currentValue; // Fallback si le formatage échoue
          }
        }
        return currentValue || '';
      })(),
      onChange: handleValueChange,
      onBlur: handleBlur, 
      onKeyDown: handleKeyDown, 
      className: `block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${fieldError ? 'border-red-500' : ''} ${inputClassName || ''} flex-grow`,
      placeholder: placeholder,
      'aria-invalid': !!fieldError,
      'aria-describedby': fieldError ? `${fieldName}-error` : undefined,
      autoFocus: true, 
    };

    let fieldElement;
    if (inputType === 'textarea') {
      fieldElement = <AutoResizeTextarea {...inputElementProps} rows={3} />;
    } else if (inputType === 'select') {
      fieldElement = (
        <select {...inputElementProps}>
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    } else {
      fieldElement = <input type={inputType} {...inputElementProps} />; // Gère 'date', 'datetime-local', 'number', etc.
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
          className={`group mt-1 text-sm text-gray-900 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'} p-2 border border-transparent ${disabled ? '' : 'hover:border-gray-300'} rounded-md min-h-[38px] flex items-center justify-between ${displayClassName || ''}`}
          role="button"
          tabIndex={disabled ? -1 : 0}
          onFocus={() => !disabled && setIsEditingField(true)}
          onKeyDown={(e) => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setIsEditingField(true);}}}
        >
          <span className="whitespace-pre-wrap break-words flex-grow">
            {inputType === 'datetime-local' && displayFormatFunction && typeof currentValue === 'string'
              ? displayFormatFunction(currentValue)
              : currentValue || <span className="text-gray-400 italic">{placeholder || 'Non renseigné'}</span>}
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
