import React, { ReactNode } from 'react';
import { NavigationProvider } from '@src/contexts/NavigationContext';
import { ConnectModalProvider } from '@src/contexts/ConnectModalContext';
import { PAGE_IDS } from '@src/components/ConnectModal/PageIds';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';

interface ConnectUIProvidersProps {
  children: ReactNode;
  onConnect: (result: WalletConnectionResult) => void;
  displayedWallets: WalletAdapter[];
}

/**
 * Shared provider stack for wallet connection UI.
 *
 * Wraps NavigationProvider and ConnectModalProvider (which includes EmbeddedAuthProvider).
 * Used by both renderConnectModal and ConnectWidget for consistent behavior.
 *
 * ## Hierarchy
 * ```
 * ConnectUIProviders
 *   └── NavigationProvider (page routing)
 *       └── ConnectModalProvider (connection logic)
 *           └── EmbeddedAuthProvider (email/SMS embedded wallet auth state)
 *               └── {children}
 * ```
 */
export const ConnectUIProviders: React.FC<ConnectUIProvidersProps> = ({ children, onConnect, displayedWallets }) => (
  <NavigationProvider initialPage={PAGE_IDS.SELECT_WALLET}>
    <ConnectModalProvider onConnect={onConnect} displayedWallets={displayedWallets}>
      {children}
    </ConnectModalProvider>
  </NavigationProvider>
);
