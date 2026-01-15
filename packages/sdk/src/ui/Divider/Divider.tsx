import React from 'react';
import './Divider.css';

interface DividerProps {
  children?: React.ReactNode;
}

export const Divider: React.FC<DividerProps> = ({ children }) => {
  return (
    <div className="divider">
      <div className="divider-line" />
      {children && <div className="divider-text">{children}</div>}
      <div className="divider-line" />
    </div>
  );
};
