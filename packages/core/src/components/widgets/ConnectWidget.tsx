import React, { useMemo, useCallback } from 'react';
import { ConnectUIProviders } from '@src/components/ConnectUIProviders';
import { WidgetShell, WidgetStyleContainer } from '@src/components/widgets/WidgetShell';
import { ConnectPages } from '@src/components/ConnectModal/ConnectPages';
import { WalletConnectionResult } from '@src/types/internal';
import { sortWallets } from '@src/utils/sortWallets';
import { Aurum } from '@src/Aurum';
import { UserInfo } from '@aurum-sdk/types';

export interface ConnectWidgetProps {
  aurum: Aurum;
  onConnect?: (result: UserInfo) => void;
}

export const ConnectWidget: React.FC<ConnectWidgetProps> = ({ aurum, onConnect }) => {
  const brandConfig = aurum.brandConfig;
  const walletAdapters = aurum.walletAdapters;
  const excludedWalletIds = aurum.excludedWalletIds;

  const displayedWallets = useMemo(() => {
    const filtered = walletAdapters.filter((w) => !excludedWalletIds.has(w.id));
    return sortWallets(filtered, { filterHidden: false });
  }, [walletAdapters, excludedWalletIds]);

  const handleConnect = useCallback(
    async (result: WalletConnectionResult) => {
      // Sync connection state with AurumCore (updates userInfo, provider, store, etc.)
      const userInfo = await aurum.handleWidgetConnection(result);
      onConnect?.(userInfo);
    },
    [aurum, onConnect],
  );

  return (
    <WidgetStyleContainer brandConfig={brandConfig}>
      <ConnectUIProviders onConnect={handleConnect} displayedWallets={displayedWallets}>
        <WidgetShell brandConfig={brandConfig}>
          <ConnectPages />
        </WidgetShell>
      </ConnectUIProviders>
    </WidgetStyleContainer>
  );
};
