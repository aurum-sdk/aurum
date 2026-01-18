import React, { useMemo } from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import { Spacer, Column, Button } from '@src/ui';
import { X } from 'lucide-react';
import { Divider } from '@src/ui';
import { ModalHeader } from '@src/components/ModalHeader/ModalHeader';
import { sortWallets } from '@src/utils/sortWallets';
import { AuthInput } from '@src/components/ConnectModal/AuthInput';
import { WalletListGrid } from '@src/components/ConnectModal/WalletListGrid';
import { WalletListStacked } from '@src/components/ConnectModal/WalletListStacked';
import { WalletId } from '@aurum-sdk/types';

export const SelectWalletPage: React.FC = () => {
  const { displayedWallets } = useConnectModal();
  const { onDismiss, brandConfig } = useWidgetContext();

  // Show auth input if either email or SMS is enabled
  const hasEmailAuth = displayedWallets.some((wallet) => wallet.id === WalletId.Email);
  const hasSmsAuth = displayedWallets.some((wallet) => wallet.id === WalletId.Sms);
  const hasEmbeddedAuth = hasEmailAuth || hasSmsAuth;

  const sortedWallets = useMemo(() => sortWallets(displayedWallets), [displayedWallets]);
  const isGridLayout = brandConfig.walletLayout === 'grid';

  return (
    <>
      <ModalHeader
        title="Log in or sign up"
        rightAction={
          <Button size="sm" variant="close" onClick={onDismiss} aria-label="Close">
            <X size={20} color="var(--color-foreground-muted)" />
          </Button>
        }
      />
      {hasEmbeddedAuth && (
        <>
          <Column align="center" gap={0}>
            <AuthInput />
          </Column>
          {sortedWallets.length > 0 && (
            <>
              <Spacer size={20} />
              <Divider>or continue with</Divider>
              <Spacer size={20} />
            </>
          )}
        </>
      )}

      {isGridLayout ? (
        <WalletListGrid wallets={sortedWallets} />
      ) : (
        <WalletListStacked wallets={sortedWallets} hasEmailAuth={hasEmailAuth} hasSmsAuth={hasSmsAuth} />
      )}
    </>
  );
};
