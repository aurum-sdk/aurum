import React from 'react';
import { WalletAdapter } from '@src/types/internal';
import { GridWalletButton } from '@src/components/WalletButton/GridWalletButton';
import '@src/components/ConnectModal/WalletGrid.css';
import { useConnectModal } from '@src/contexts/ConnectModalContext';

interface WalletListGridProps {
  wallets: WalletAdapter[];
}

const MAX_COLUMNS = 4;

function getColumnCount(itemCount: number): number {
  if (itemCount <= MAX_COLUMNS) return itemCount;
  const numRows = Math.ceil(itemCount / MAX_COLUMNS);
  return Math.ceil(itemCount / numRows);
}

export const WalletListGrid: React.FC<WalletListGridProps> = ({ wallets }) => {
  const { connectWallet } = useConnectModal();
  const columns = getColumnCount(wallets.length);

  return (
    <div className="aurum-wallet-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {wallets.map((wallet) => (
        <GridWalletButton key={wallet.id} wallet={wallet} connectWallet={connectWallet} />
      ))}
    </div>
  );
};
