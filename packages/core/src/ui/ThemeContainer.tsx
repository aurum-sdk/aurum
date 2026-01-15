import React from 'react';

interface ThemeContainerProps {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
}

export const ThemeContainer: React.FC<ThemeContainerProps> = ({ children, theme = 'light' }) => {
  return (
    <div className="aurum-sdk" data-theme={theme}>
      {children}
    </div>
  );
};
