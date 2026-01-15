import MobileDetect from 'mobile-detect';

// Returns true if mobile phone or tablet
export function isMobile(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const md = new MobileDetect(window.navigator.userAgent);

  return md.mobile() !== null || md.tablet() !== null;
}
