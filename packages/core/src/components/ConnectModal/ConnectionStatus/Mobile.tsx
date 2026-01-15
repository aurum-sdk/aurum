import React, { useState, useEffect } from 'react';
import { useConnectModal } from '@src/contexts/ConnectModalContext';
import { Text, Button } from '@src/ui';
import { ConnectionStatusBase } from './ConnectionStatusBase';

export const ConnectionStatusMobilePage: React.FC = () => {
  const { selectedWallet, error, success, retryConnection } = useConnectModal();
  const [showLaunchButton, setShowLaunchButton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchButton(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ConnectionStatusBase
      title={selectedWallet?.name}
      pendingHeaderText={`Opening ${selectedWallet?.name}`}
      pendingSubContent={
        <Text size="sm" variant="secondary" align="center" style={{ maxWidth: '18.75rem' }}>
          If {selectedWallet?.name} doesn't open automatically, click the button below
        </Text>
      }
      extraContent={
        showLaunchButton && !success && !error ? (
          <Button variant="tertiary" size="md" onClick={retryConnection} style={{ width: '100%', marginTop: '0.5rem' }}>
            Launch App
          </Button>
        ) : undefined
      }
    />
  );
};
