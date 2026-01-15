import React, { ReactNode, useRef } from 'react';
import { WidgetProvider } from '@src/contexts/WidgetContext';
import { useNavigation } from '@src/contexts/NavigationContext';
import { ThemeContainer } from '@src/ui';
import { PoweredBy } from '@src/components/PoweredBy/PoweredBy';
import { Spacer } from '@src/ui';
import { PageTransitionContainer } from '@src/components/PageTransitionContainer';
import { generateCompleteStyles } from '@src/utils/generateBrandStyles';
import { POWERED_BY_SPACER_REM } from '@src/constants/layout';
import { NonNullableBrandConfig } from '@aurum/types';

export interface WidgetShellProps {
  brandConfig: NonNullableBrandConfig;
  children: ReactNode;
}

// Noop for widget mode - close buttons are hidden via ModalHeader
const noop = () => {};

/**
 * Shell component for embedded widgets.
 *
 * Mirrors the Modal component structure but without overlay.
 * Provider hierarchy is handled by ConnectWidget.
 *
 * ## Hierarchy
 * ```
 * ConnectWidget
 *   └── StyleContainer (inline styles)
 *       └── ThemeContainer
 *           └── NavigationProvider
 *               └── ConnectModalProvider
 *                   └── WidgetShell ← you are here
 *                       └── WidgetProvider (mode='widget')
 *                           └── PageTransitionContainer
 *                               └── ConnectPages
 * ```
 *
 * @see ModalShell - Modal equivalent of this component
 */
export const WidgetShell: React.FC<WidgetShellProps> = ({ brandConfig, children }) => {
  const headerPortalRef = useRef<HTMLDivElement>(null);
  const { currentPage } = useNavigation();

  return (
    <WidgetProvider mode="widget" brandConfig={brandConfig} onDismiss={noop} headerPortalRef={headerPortalRef}>
      <div className="widget-provider">
        <div ref={headerPortalRef} />
        <PageTransitionContainer transitionKey={currentPage}>{children}</PageTransitionContainer>
        {!brandConfig.hideFooter ? (
          <>
            <Spacer size={`${POWERED_BY_SPACER_REM}rem`} />
            <PoweredBy />
          </>
        ) : (
          <Spacer size="0.3125rem" />
        )}
      </div>
    </WidgetProvider>
  );
};

interface WidgetStyleContainerProps {
  children: React.ReactNode;
  brandConfig: NonNullableBrandConfig;
}

/**
 * Style injection container for widgets.
 *
 * Equivalent to createShadowRoot for modals but uses inline styles
 * since widgets are embedded in the host page.
 */
export const WidgetStyleContainer: React.FC<WidgetStyleContainerProps> = ({ children, brandConfig }) => {
  return (
    <div className="aurum-widget" style={{ width: '100%' }}>
      <style>{generateCompleteStyles(brandConfig)}</style>
      <ThemeContainer theme={brandConfig.theme}>{children}</ThemeContainer>
    </div>
  );
};
