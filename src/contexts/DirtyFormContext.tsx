'use client';

import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';

/*
 * This context is used to manage the dirty state of forms across the application.
 * It allows components to register as dirty sources and provides a way to check if the page has unsaved changes.
 */
interface DirtyFormContextType {
  isPageDirty: boolean;
  addDirtySource: (sourceId: string) => void;
  removeDirtySource: (sourceId: string) => void;
}

const DirtyFormContext = createContext<DirtyFormContextType | undefined>(undefined);

export const DirtyFormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dirtySources, setDirtySources] = useState<Set<string>>(new Set());

  const addDirtySource = useCallback((sourceId: string) => {
    setDirtySources(prevSources => {
      const newSources = new Set(prevSources);
      newSources.add(sourceId);
      return newSources;
    });
  }, []);

  const removeDirtySource = useCallback((sourceId: string) => {
    setDirtySources(prevSources => {
      const newSources = new Set(prevSources);
      newSources.delete(sourceId);
      return newSources;
    });
  }, []);

  const isPageDirty = useMemo(() => dirtySources.size > 0, [dirtySources]);

  return (
    <DirtyFormContext.Provider value={{ isPageDirty, addDirtySource, removeDirtySource }}>
      {children}
    </DirtyFormContext.Provider>
  );
};

export const useDirtyForm = (): DirtyFormContextType => {
  const context = useContext(DirtyFormContext);
  if (context === undefined) {
    throw new Error('useDirtyForm must be used within a DirtyFormProvider');
  }
  return context;
};
