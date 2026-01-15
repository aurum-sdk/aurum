import React, { useState } from 'react';
import { Modal } from '@src/ui';
import { ConnectPages } from '@src/components/ConnectModal/ConnectPages';
import { useNavigation } from '@src/contexts/NavigationContext';
import { NonNullableBrandConfig } from '@aurum/types';

interface ModalShellProps {
  onClose: () => void;
  brandConfig: NonNullableBrandConfig;
}

/**
 * Shell component for the connect modal.
 *
 * Wraps the Modal UI component and renders ConnectPages inside.
 * Provider hierarchy is handled by renderConnectModal.
 *
 * ## Hierarchy
 * ```
 * renderConnectModal
 *   └── ThemeContainer
 *       └── ConnectUIProviders (NavigationProvider + ConnectModalProvider)
 *           └── ModalShell ← you are here
 *               └── Modal
 *                   └── WidgetProvider (mode='modal')
 *                       └── PageTransitionContainer
 *                           └── ConnectPages
 * ```
 */
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
