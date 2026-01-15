import React from 'react';

interface QREyeProps {
  x: number;
  y: number;
  eyeSize: number;
  eyeRadius: number;
  dotSize: number;
  fillColor: string;
  bgColor: string;
}

export const QREye: React.FC<QREyeProps> = ({ x, y, eyeSize, eyeRadius, dotSize, fillColor, bgColor }) => {
  const padding = dotSize * 0.8;
  const centerRadius = ((eyeSize - 4 * padding) / 2) * 1.1;

  return (
    <g>
      {/* Outer square */}
      <rect
        x={x}
        y={y}
        width={eyeSize}
        height={eyeSize}
        fill={fillColor}
        rx={eyeRadius}
        ry={eyeRadius}
        className="qr-skeleton-eye"
      />
      {/* Inner white space */}
      <rect
        x={x + padding}
        y={y + padding}
        width={eyeSize - 2 * padding}
        height={eyeSize - 2 * padding}
        fill={bgColor}
        rx={eyeRadius / 2}
        ry={eyeRadius / 2}
      />
      {/* Inner center circle */}
      <circle cx={x + eyeSize / 2} cy={y + eyeSize / 2} r={centerRadius} fill={fillColor} className="qr-skeleton-eye" />
    </g>
  );
};
