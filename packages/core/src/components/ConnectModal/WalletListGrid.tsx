import React from 'react';
import { WalletAdapter } from '@src/types/internal';
import { GridWalletButton } from '@src/components/WalletButton/GridWalletButton';
import '@src/components/ConnectModal/WalletGrid.css';
import { useConnectModal } from '@src/contexts/ConnectModalContext';

interface WalletListGridProps {
  wallets: WalletAdapter[];
}

const MAX_PER_ROW = 4;

function splitIntoRows<T>(items: T[]): T[][] {
  if (items.length === 0) return [];

  const numRows = Math.ceil(items.length / MAX_PER_ROW);
  const basePerRow = Math.floor(items.length / numRows);
  const remainder = items.length % numRows;

  const rows: T[][] = [];
  let index = 0;
  for (let i = 0; i < numRows; i++) {
    const rowSize = basePerRow + (i < remainder ? 1 : 0);
    rows.push(items.slice(index, index + rowSize));
    index += rowSize;
  }
  return rows;
}

export const WalletListGrid: React.FC<WalletListGridProps> = ({ wallets }) => {
  const { connectWallet } = useConnectModal();
  const rows = splitIntoRows(wallets);

  return (
    <div className="aurum-wallet-grid">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="aurum-wallet-grid-row">
          {row.map((wallet) => (
            <GridWalletButton key={wallet.id} wallet={wallet} connectWallet={connectWallet} />
          ))}
        </div>
      ))}
    </div>
  );
};
