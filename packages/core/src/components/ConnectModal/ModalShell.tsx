import React, { useState } from 'react';
import { Modal } from '@src/ui';
import { ConnectPages } from '@src/components/ConnectModal/ConnectPages';
import { useNavigation } from '@src/contexts/NavigationContext';
import { NonNullableBrandConfig } from '@aurum-sdk/types';

interface ModalShellProps {
  onClose: () => void;
  brandConfig: NonNullableBrandConfig;
}

export const ModalShell: React.FC<ModalShellProps> = ({ onClose, brandConfig }) => {
  const [isOpen, setIsOpen] = useState(true);
  const { currentPage } = useNavigation();

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      closeOnOverlayClick
      onCloseComplete={handleClose}
      brandConfig={brandConfig}
      transitionKey={currentPage}
    >
      <ConnectPages />
    </Modal>
  );
};
