import React from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { Text } from '@src/ui';
import { ConnectionStatusBase } from './ConnectionStatusBase';

export const ConnectionStatusPage: React.FC = () => {
  const { selectedWallet } = useConnectModal();

  return (
    <ConnectionStatusBase
      pendingHeaderText={`Approve in ${selectedWallet?.name}`}
      pendingSubContent={
        <Text align="center" size="sm" variant="secondary">
          Please check your wallet to{'\n'}approve the connection
        </Text>
      }
    />
  );
};
