import React, { useMemo, useCallback } from 'react';
import { ConnectUIProviders } from '@src/components/ConnectUIProviders';
import { WidgetShell, WidgetStyleContainer } from '@src/components/widgets/WidgetShell';
import { ConnectPages } from '@src/components/ConnectModal/ConnectPages';
import { WalletConnectionResult } from '@src/types/internal';
import { sortWallets } from '@src/utils/sortWallets';
import { isMobile } from '@src/utils/platform/isMobile';
import { Aurum } from '@src/Aurum';
import { UserInfo, WalletId } from '@aurum-sdk/types';

export interface ConnectWidgetProps {
  aurum: Aurum;
  onConnect?: (result: UserInfo) => void;
}

/**
 * Embedded connect widget for embedded wallet connection.
 *
 * ## Hierarchy (mirrors renderConnectModal)
 * ```
 * ConnectWidget ← you are here
 *   └── WidgetStyleContainer (style injection + ThemeContainer)
 *       └── ConnectUIProviders (NavigationProvider + ConnectModalProvider)
 *           └── WidgetShell
 *               └── WidgetProvider (mode='widget')
 *                   └── PageTransitionContainer
 *                       └── ConnectPages (shared with modal)
 * ```
 *
 * @see renderConnectModal - Modal equivalent entry point
 * @see WidgetShell - Shell component (parallel to ModalShell)
 *
 * @example
 * ```tsx
 * <ConnectWidget
 *   aurum={aurum}
 *   onConnect={({ publicAddress, walletId, walletName }) => {
 *     console.log('Connected:', publicAddress, walletId, walletName);
 *   }}
 * />
 * ```
 */
export const ConnectWidget: React.FC<ConnectWidgetProps> = ({ aurum, onConnect }) => {
  const brandConfig = aurum.brandConfig;
  const walletAdapters = aurum.walletAdapters;
  const excludedWalletIds = aurum.excludedWalletIds;

  const displayedWallets = useMemo(() => {
    let filtered = walletAdapters.filter((w) => !excludedWalletIds.has(w.id));
    filtered = sortWallets(filtered, { filterHidden: false });

    // On mobile, WalletConnect requires AppKit
    const hasAppKit = filtered.some((w) => w.id === WalletId.AppKit);
    if (isMobile() && !hasAppKit) {
      filtered = filtered.filter((w) => w.id !== WalletId.WalletConnect);
    }

    return filtered;
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
