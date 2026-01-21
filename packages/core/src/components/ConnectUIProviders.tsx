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

export const ConnectUIProviders: React.FC<ConnectUIProvidersProps> = ({ children, onConnect, displayedWallets }) => (
  <NavigationProvider initialPage={PAGE_IDS.SELECT_WALLET}>
    <ConnectModalProvider onConnect={onConnect} displayedWallets={displayedWallets}>
      {children}
    </ConnectModalProvider>
  </NavigationProvider>
);
