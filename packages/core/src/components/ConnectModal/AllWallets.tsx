import React, { useMemo } from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useNavigation } from '@src/contexts/NavigationContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { Column, Button } from '@src/ui';
import { X, ChevronLeft } from 'lucide-react';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { WalletButton } from '@src/components/WalletButton/WalletButton';
import { useAurumStore } from '@src/store';
import { sortWallets } from '@src/utils/sortWallets';
import { PAGE_IDS } from '@src/components/ConnectModal/PageIds';

export const AllWalletsPage: React.FC = () => {
  const { onDismiss } = useWidgetContext();
  const { navigateTo } = useNavigation();
  const { displayedWallets, connectWallet } = useConnectModal();

  const lastUsedWalletId = useAurumStore((state) => state.lastUsedWalletId);

  const sortedWallets = useMemo(() => sortWallets(displayedWallets), [displayedWallets]);

  const goBackToSelectWallet = () => {
    navigateTo(PAGE_IDS.SELECT_WALLET);
  };

  return (
    <>
      <ModalHeader
        leftAction={
          <Button size="sm" variant="close" onClick={goBackToSelectWallet} aria-label="Go back">
            <ChevronLeft size={20} color="var(--color-foreground-muted)" />
          </Button>
        }
        rightAction={
          <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
            <X size={20} color="var(--color-foreground-muted)" />
          </Button>
        }
        title="All Wallets"
      />
      <Column justify="start" style={{ maxHeight: '22rem', overflowY: 'auto' }}>
        {sortedWallets.map((wallet) => {
          return (
            <WalletButton
              key={wallet.id}
              wallet={wallet}
              connectWallet={connectWallet}
              isLastUsed={wallet.id === lastUsedWalletId}
            />
          );
        })}
      </Column>
    </>
  );
};
