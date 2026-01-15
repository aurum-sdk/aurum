import { Loader2 } from 'lucide-react';
import './Spinner.css';

export const Spinner = ({
  size = 16,
  color = 'var(--aurum-primary-color)',
  strokeWidth = 2,
}: {
  size?: number;
  color?: string;
  strokeWidth?: number;
}) => {
  return (
    <Loader2
      className="spinner"
      strokeWidth={strokeWidth}
      size={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        color,
      }}
    />
  );
};
