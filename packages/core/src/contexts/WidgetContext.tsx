import React, { createContext, useContext, RefObject } from 'react';
import { NonNullableBrandConfig } from '@aurum-sdk/types';

/**
 * Rendering mode for SDK UI components.
 *
 * - `'modal'`: Rendered inside Modal overlay (has close button, can be dismissed)
 * - `'widget'`: Rendered embedded on page (no close button)
 */
export type WidgetMode = 'modal' | 'widget';

interface WidgetContextType {
  mode: WidgetMode;
  brandConfig: NonNullableBrandConfig;
  onDismiss: () => void;
  headerPortalRef: RefObject<HTMLDivElement | null> | null;
}

const WidgetContext = createContext<WidgetContextType | null>(null);

// All page components should use this hook
export const useWidgetContext = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error('useWidgetContext must be used within a WidgetProvider');
  }
  return context;
};

interface WidgetProviderProps {
  children: React.ReactNode;
  mode: WidgetMode;
  brandConfig: NonNullableBrandConfig;
  onDismiss: () => void;
  headerPortalRef?: RefObject<HTMLDivElement | null> | null;
}

/**
 * Unified provider for both modal and widget contexts.
 */
export const WidgetProvider: React.FC<WidgetProviderProps> = ({
  children,
  mode,
  brandConfig,
  onDismiss,
  headerPortalRef = null,
}) => {
  const contextValue: WidgetContextType = {
    mode,
    brandConfig,
    onDismiss,
    headerPortalRef,
  };

  return <WidgetContext.Provider value={contextValue}>{children}</WidgetContext.Provider>;
};
