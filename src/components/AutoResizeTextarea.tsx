'use client';

import React, { useEffect, useRef } from 'react';

const AutoResizeTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ value, onChange, className, ...props }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = (textarea: HTMLTextAreaElement | null) => {
    if (textarea) {
      textarea.style.height = 'auto'; // Réinitialiser pour obtenir la bonne scrollHeight
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize(textareaRef.current);
  }, [value]); // Redimensionner lorsque la valeur change

  // Redimensionner au montage initial si une valeur par défaut est présente
  useEffect(() => {
    autoResize(textareaRef.current);
  }, []);


  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResize(event.target);
    if (onChange) {
      onChange(event);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      className={`${className} overflow-hidden`} // overflow-hidden pour éviter la barre de défilement momentanée
      style={{ resize: 'none' }} // Désactiver le redimensionnement manuel par l'utilisateur
      {...props}
    />
  );
};

export default AutoResizeTextarea;
