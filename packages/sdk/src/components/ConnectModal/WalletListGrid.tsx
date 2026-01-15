import React from 'react';
import { WalletAdapter } from '@src/types/internal';
import { GridWalletButton } from '@src/components/WalletButton/GridWalletButton';
import '@src/components/ConnectModal/WalletGrid.css';
import { useConnectModal } from '@src/contexts/ConnectModalContext';

interface WalletListGridProps {
  wallets: WalletAdapter[];
}

const getGridColumns = (walletCount: number): number => {
  if (walletCount <= 2) return 2;
  if (walletCount === 3) return 3;
  if (walletCount === 5) return 3;
  if (walletCount === 6) return 3;
  return 4;
};

export const WalletListGrid: React.FC<WalletListGridProps> = ({ wallets }) => {
  const { connectWallet } = useConnectModal();

  const columns = getGridColumns(wallets.length);

  return (
    <div className="aurum-wallet-grid" style={{ '--grid-columns': columns } as React.CSSProperties}>
      {wallets.map((wallet) => (
        <GridWalletButton key={wallet.id} wallet={wallet} connectWallet={connectWallet} />
      ))}
    </div>
  );
};
