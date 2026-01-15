declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'react-qrcode-logo' {
  import React from 'react';

  interface IProps {
    value?: string;
    ecLevel?: 'L' | 'M' | 'Q' | 'H';
    enableCORS?: boolean;
    size?: number;
    quietZone?: number;
    bgColor?: string;
    fgColor?: string;
    logoImage?: string;
    logoWidth?: number;
    logoHeight?: number;
    logoOpacity?: number;
    removeQrCodeBehindLogo?: boolean;
    logoPadding?: number;
    logoPaddingStyle?: 'square' | 'circle';
    qrStyle?: 'squares' | 'dots' | 'fluid';
    eyeRadius?: number | number[];
    eyeColor?: string | { outer: string; inner: string } | Array<string | { outer: string; inner: string }>;
    id?: string;
    style?: React.CSSProperties;
    logoOnLoad?: (event: Event) => void;
  }

  export class QRCode extends React.Component<IProps> {}
}
