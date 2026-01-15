import React from 'react';

interface GenerateSkeletonDotsParams {
  logoSize: number;
  dotSize: number;
  eyeSize: number;
  gridSize: number;
  fillColor: string;
}

export const generateSkeletonDots = ({
  logoSize,
  dotSize,
  eyeSize,
  gridSize,
  fillColor,
}: GenerateSkeletonDotsParams): React.ReactNode[] => {
  const dots: React.ReactNode[] = [];

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const x = col * dotSize;
      const y = row * dotSize;

      // Skip eye areas (corners) with NO padding - exact eye size only
      const eyeAreaWithPadding = Math.ceil(eyeSize / dotSize);

      const isTopLeftEye = row < eyeAreaWithPadding && col < eyeAreaWithPadding;
      const isTopRightEye = row < eyeAreaWithPadding && col >= gridSize - eyeAreaWithPadding;
      const isBottomLeftEye = row >= gridSize - eyeAreaWithPadding && col < eyeAreaWithPadding;

      // Skip logo area (center) - fix centering by using proper center calculation
      const centerX = (gridSize - 1) / 2;
      const centerY = (gridSize - 1) / 2;
      const logoPaddingInGridUnits = 6 / dotSize;
      const logoHalfSize = logoSize / dotSize / 2 + logoPaddingInGridUnits;
      const isLogoArea = Math.abs(col - centerX) < logoHalfSize && Math.abs(row - centerY) < logoHalfSize;

      if (!isTopLeftEye && !isTopRightEye && !isBottomLeftEye && !isLogoArea) {
        dots.push(
          <circle
            key={`${row}-${col}`}
            cx={x + dotSize / 2}
            cy={y + dotSize / 2}
            r={dotSize * 0.25}
            fill={fillColor}
            className="qr-skeleton-dot"
          />,
        );
      }
    }
  }

  return dots;
};
