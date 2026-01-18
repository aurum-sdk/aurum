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

/**
 * The SelectWallet page has a fixed number of visual "slots" to maintain consistent UI height.
 * This function calculates which wallets to display based on how many slots are consumed by auth options.
 *
 * Slot allocation:
 * - Email + SMS auth: 2 slots (input field + toggle button)
 * - Single auth (email OR sms): 1 slot (just the input field)
 * - No auth: 0 slots
 *
 * The remaining slots are filled with wallet buttons, with the last slot potentially
 * being an "All Wallets" button if there are more wallets than available slots.
 */
function calculateWalletDisplay({
  wallets,
  hasEmailAuth,
  hasSmsAuth,
  totalSlots = 5,
  slotsForBothAuth = 2,
  slotsForSingleAuth = 1,
}: {
  wallets: WalletAdapter[];
  hasEmailAuth: boolean;
  hasSmsAuth: boolean;
  /** Total visual slots available on the SelectWallet page */
  totalSlots?: number;
  /** Slots consumed when both email and SMS auth are enabled (input + toggle) */
  slotsForBothAuth?: number;
  /** Slots consumed when only one auth method is enabled (just input) */
  slotsForSingleAuth?: number;
}) {
  // Calculate slots consumed by auth options
  const hasBothAuth = hasEmailAuth && hasSmsAuth;
  const hasOneAuth = (hasEmailAuth || hasSmsAuth) && !hasBothAuth;
  const slotsUsedByAuth = hasBothAuth ? slotsForBothAuth : hasOneAuth ? slotsForSingleAuth : 0;

  // Remaining slots for wallet buttons (including potential "All Wallets" button)
  const maxWalletSlots = totalSlots - slotsUsedByAuth;

  // Wallets that won't fit in the main view
  const additionalWallets = wallets.slice(maxWalletSlots);
  const hasAdditionalWallets = additionalWallets.length > 0;

  // If only 1 additional wallet, show it directly instead of "All Wallets" button
  // (showing a button for just 1 wallet is wasteful)
  const showAllWalletsButton = additionalWallets.length > 1;

  const walletsToShow = showAllWalletsButton
    ? wallets.slice(0, maxWalletSlots) // Leave room for "All Wallets" button
    : hasAdditionalWallets
      ? wallets.slice(0, maxWalletSlots + 1) // Include the single extra wallet
      : wallets;

  return {
    walletsToShow,
    additionalWallets,
    showAllWalletsButton,
  };
}

interface WalletListStackedProps {
  wallets: WalletAdapter[];
  hasEmailAuth: boolean;
  hasSmsAuth: boolean;
}

export const WalletListStacked: React.FC<WalletListStackedProps> = ({ wallets, hasEmailAuth, hasSmsAuth }) => {
  const { navigateTo } = useNavigation();
  const { connectWallet } = useConnectModal();

  const lastUsedWalletId = useAurumStore((state) => state.lastUsedWalletId);

  const { walletsToShow, additionalWallets, showAllWalletsButton } = calculateWalletDisplay({
    wallets,
    hasEmailAuth,
    hasSmsAuth,
  });

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

      {showAllWalletsButton && (
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
