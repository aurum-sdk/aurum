import React from 'react';
import { useNavigation } from '@src/contexts/NavigationContext';
import { PAGE_IDS, PAGE_COMPONENTS } from '@src/components/ConnectModal/PageIds';

/**
 * Shared page renderer for both Modal and Widget modes.
 *
 * Renders the current page based on NavigationContext.
 * Used by both ModalShell and WidgetShell.
 */
export const ConnectPages: React.FC = () => {
  const { currentPage } = useNavigation();

  return PAGE_COMPONENTS[currentPage] || PAGE_COMPONENTS[PAGE_IDS.SELECT_WALLET];
};
