import React from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { Text } from '@src/ui';
import { ConnectionStatusBase } from './ConnectionStatusBase';
import { WalletId } from '@aurum/types';

export const ConnectionStatusPage: React.FC = () => {
  const { selectedWallet } = useConnectModal();

  return (
    <ConnectionStatusBase
      pendingHeaderText={`Approve in ${selectedWallet?.name}`}
      pendingSubContent={
        <Text align="center" size="sm" variant="secondary">
          {selectedWallet?.id === WalletId.Ledger
            ? `Please wait for the Ledger Live modal to open`
            : `Please check your wallet to\napprove the connection`}
        </Text>
      }
    />
  );
};
