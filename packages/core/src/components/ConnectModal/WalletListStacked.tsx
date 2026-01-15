import React from 'react';
import { WalletAdapter } from '@src/types/internal';
import { Column, Button, Row, Text } from '@src/ui';
import { ChevronRight } from 'lucide-react';
import { WalletButton } from '@src/components/WalletButton/WalletButton';
import { AdditionalWalletsIcon } from '@src/components/ConnectModal/AdditionalWalletsIcon';
import { PAGE_IDS } from '@src/components/ConnectModal/PageIds';
import { useAurumStore } from '@src/store';
import { useNavigation } from '@src/contexts/NavigationContext';
import { useConnectModal } from '@src/contexts/ConnectModalContext';

interface WalletListStackedProps {
  wallets: WalletAdapter[];
  hasEmailAuth: boolean;
}

export const WalletListStacked: React.FC<WalletListStackedProps> = ({ wallets, hasEmailAuth }) => {
  const { navigateTo } = useNavigation();
  const { connectWallet } = useConnectModal();

  const lastUsedWalletId = useAurumStore((state) => state.lastUsedWalletId);

  const showAllButton = hasEmailAuth ? wallets.length > 4 : wallets.length > 5;
  const walletsToShow = showAllButton ? wallets.slice(0, 3) : wallets;
  const additionalWallets = showAllButton ? wallets.slice(3) : [];

  const goToAllWallets = () => {
    navigateTo(PAGE_IDS.ALL_WALLETS);
  };

  return (
    <Column>
      {walletsToShow.map((wallet) => (
        <WalletButton
          key={wallet.id}
          wallet={wallet}
          connectWallet={connectWallet}
          isLastUsed={wallet.id === lastUsedWalletId}
        />
      ))}

      {showAllButton && (
        <Button variant="secondary" onClick={goToAllWallets} expand>
          <Row justify="space-between" align="center" style={{ width: '100%' }}>
            <Row align="center" gap={10}>
              <AdditionalWalletsIcon additionalWallets={additionalWallets} size={32} />
              <Text weight="semibold" size="md">
                All Wallets
              </Text>
            </Row>
            <ChevronRight size={18} color="var(--color-foreground-subtle)" />
          </Row>
        </Button>
      )}
    </Column>
  );
};
