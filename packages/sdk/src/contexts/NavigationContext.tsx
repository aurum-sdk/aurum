import React, { createContext, useContext, useState, ReactNode } from 'react';
import { PageIdType } from '@src/components/ConnectModal/PageIds';

interface NavigationContextType {
  currentPage: PageIdType;
  navigateTo: (pageId: PageIdType) => void;
  navigateBack: () => void;
  canNavigateBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  initialPage: PageIdType;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({ children, initialPage }) => {
  const [currentPage, setCurrentPage] = useState<PageIdType>(initialPage);
  const [pageHistory, setPageHistory] = useState<PageIdType[]>([initialPage]);

  const navigateTo = (pageId: PageIdType) => {
    setCurrentPage(pageId);
    setPageHistory((prev) => [...prev, pageId]);
  };

  const navigateBack = () => {
    if (pageHistory.length > 1) {
      const newHistory = pageHistory.slice(0, -1);
      const previousPage = newHistory[newHistory.length - 1];
      setPageHistory(newHistory);
      setCurrentPage(previousPage);
    }
  };

  const canNavigateBack = pageHistory.length > 1;

  const value: NavigationContextType = {
    currentPage,
    navigateTo,
    navigateBack,
    canNavigateBack,
  };

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
