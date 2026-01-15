import React, { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Text } from '@src/ui';
import { useWidgetContext } from '@src/contexts/WidgetContext';
import './ModalHeader.css';

interface ModalHeaderProps {
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  title?: React.ReactNode | string;
}

export const ModalHeader = ({ leftAction, rightAction, title }: ModalHeaderProps) => {
  const { headerPortalRef, mode } = useWidgetContext();
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null);

  // Capture the portal target from context after mount
  useLayoutEffect(() => {
    if (headerPortalRef) {
      setPortalTarget(headerPortalRef.current);
    }
  }, [headerPortalRef]);

  // In widget mode, don't render the close button (rightAction)
  const resolvedRightAction = mode === 'widget' ? null : rightAction;

  const headerContent = (
    <header className="modal-header">
      <div className="modal-header-left">{leftAction}</div>
      <div className="modal-header-center">
        {typeof title === 'string' ? (
          <Text align="center" variant="secondary" style={{ fontSize: '15px' }}>
            {title}
          </Text>
        ) : (
          title
        )}
      </div>
      <div className="modal-header-right">{resolvedRightAction}</div>
    </header>
  );

  if (!portalTarget) return null;

  return createPortal(headerContent, portalTarget);
};
