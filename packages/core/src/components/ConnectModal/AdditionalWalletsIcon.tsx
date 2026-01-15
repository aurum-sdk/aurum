import React from 'react';
import { WalletAdapter } from '@src/types/internal';
import { WalletLogoWrapper } from '@src/components/WalletLogoWrapper/WalletLogoWrapper';
import { Row } from '@src/ui';
import './AdditionalWalletsIcon.css';

interface AdditionalWalletsIconProps {
  additionalWallets: WalletAdapter[];
  size?: number;
}

export const AdditionalWalletsIcon: React.FC<AdditionalWalletsIconProps> = ({ additionalWallets, size = 32 }) => {
  const walletCount = additionalWallets.length;

  // 1 wallet: single centered icon
  if (walletCount === 1) {
    const iconSize = Math.floor(size * 0.7);
    return (
      <div className="additional-wallets-container" style={{ width: size, height: size }}>
        <WalletLogoWrapper
          id={additionalWallets[0].id}
          size={iconSize}
          sizeSlot="xs"
          title={additionalWallets[0].name}
        />
      </div>
    );
  }

  // 2 wallets: horizontal row with overlapping effect
  if (walletCount === 2) {
    const iconSize = Math.floor(size * 0.55);
    return (
      <div className="additional-wallets-container" style={{ width: size, height: size }}>
        <Row align="center" gap={0}>
          <div
            className="circular-icon-wrapper circular-icon-wrapper--front"
            style={{ width: iconSize, height: iconSize }}
          >
            <WalletLogoWrapper
              id={additionalWallets[0].id}
              size={iconSize}
              sizeSlot="xs"
              title={additionalWallets[0].name}
            />
          </div>
          <div
            className="circular-icon-wrapper circular-icon-wrapper--back"
            style={{ width: iconSize, height: iconSize }}
          >
            <WalletLogoWrapper
              id={additionalWallets[1].id}
              size={iconSize}
              sizeSlot="xs"
              title={additionalWallets[1].name}
            />
          </div>
        </Row>
      </div>
    );
  }

  // 3+ wallets: 2x2 grid (take up to 4)
  const walletsToShow = additionalWallets.slice(0, 4);
  const iconSize = Math.floor(size * 0.4);

  return (
    <div className="additional-wallets-grid" style={{ width: size, height: size }}>
      {walletsToShow.map((wallet) => (
        <div key={wallet.id} className="additional-wallets-grid-item" style={{ width: iconSize, height: iconSize }}>
          <WalletLogoWrapper id={wallet.id} size={iconSize} sizeSlot="xs" title={wallet.name} />
        </div>
      ))}

      {/* Fill empty slot with placeholder if 3 wallets */}
      {walletsToShow.length === 3 && (
        <div className="additional-wallets-placeholder" style={{ width: iconSize, height: iconSize }} />
      )}
    </div>
  );
};
