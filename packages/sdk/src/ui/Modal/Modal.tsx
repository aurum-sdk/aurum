import React, { ReactNode, useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { WidgetProvider } from '@src/contexts/WidgetContext';
import { useFocusTrap } from '@src/hooks/useFocusTrap';
import { PageTransitionContainer } from '@src/components/PageTransitionContainer';
import { PoweredBy } from '@src/components/PoweredBy/PoweredBy';
import { Spacer } from '@src/ui';
import { POWERED_BY_SPACER_REM } from '@src/constants/layout';
import { NonNullableBrandConfig } from '@aurum/types';
import './Modal.css';

type ModalAnimationState = 'closed' | 'entering' | 'open' | 'exiting';

export interface BaseModalProps {
  isOpen: boolean;
  onCloseComplete: () => void;
  children: ReactNode;
  closeOnOverlayClick?: boolean;
  transitionKey?: string | number;
  brandConfig: NonNullableBrandConfig;
}

export const Modal: React.FC<BaseModalProps> = ({
  isOpen,
  onCloseComplete,
  children,
  closeOnOverlayClick = true,
  transitionKey = 'default',
  brandConfig,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headerPortalRef = useRef<HTMLDivElement>(null);

  const [animState, setAnimState] = useState<ModalAnimationState>('closed');

  useEffect(() => {
    if (isOpen && animState === 'closed') {
      setAnimState('entering');
    }
  }, [isOpen, animState]);

  // RAF ensures browser paints the off-screen state before transition starts
  useEffect(() => {
    if (animState !== 'entering') return;

    const rafId = requestAnimationFrame(() => {
      setAnimState('open');
      dialogRef.current?.focus();
    });

    return () => cancelAnimationFrame(rafId);
  }, [animState]);

  // Listen for transition end to complete exit animation
  useEffect(() => {
    if (animState !== 'exiting') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleTransitionEnd = (e: TransitionEvent) => {
      // Only react to transitions on the dialog itself, not children
      if (e.target === dialog) {
        setAnimState('closed');
        onCloseComplete();
      }
    };

    dialog.addEventListener('transitionend', handleTransitionEnd);
    return () => dialog.removeEventListener('transitionend', handleTransitionEnd);
  }, [animState, onCloseComplete]);

  useEffect(() => {
    if (animState === 'closed') return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [animState]);

  const handleClose = useCallback(() => {
    if (animState === 'open' || animState === 'entering') {
      setAnimState('exiting');
    }
  }, [animState]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnOverlayClick && e.target === overlayRef.current) {
        handleClose();
      }
    },
    [closeOnOverlayClick, handleClose],
  );

  const focusTrapOptions = useMemo(
    () => ({
      isActive: animState !== 'closed',
      onEscape: handleClose,
      refocusKey: transitionKey,
    }),
    [animState, handleClose, transitionKey],
  );

  useFocusTrap(dialogRef, focusTrapOptions);

  const overlayClassName = useMemo(() => {
    const classes = ['modal-overlay'];
    if (animState === 'open') classes.push('modal-open');
    if (animState === 'exiting') classes.push('modal-exiting');
    return classes.join(' ');
  }, [animState]);

  if (animState === 'closed') return null;

  return (
    <WidgetProvider mode="modal" brandConfig={brandConfig} onDismiss={handleClose} headerPortalRef={headerPortalRef}>
      <div ref={overlayRef} className={overlayClassName} onClick={handleOverlayClick}>
        <div ref={dialogRef} className="modal-content" role="dialog" aria-modal="true" tabIndex={-1}>
          <div ref={headerPortalRef} />
          <PageTransitionContainer transitionKey={transitionKey}>{children}</PageTransitionContainer>
          {brandConfig.hideFooter ? (
            <Spacer size="0.3125rem" />
          ) : (
            <>
              <Spacer size={`${POWERED_BY_SPACER_REM}rem`} />
              <PoweredBy />
            </>
          )}
        </div>
      </div>
    </WidgetProvider>
  );
};
