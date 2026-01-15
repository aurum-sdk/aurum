import { describe, it, expect } from 'vitest';
import { WalletId, BORDER_RADIUS_SCALES } from '@aurum/types';
import { resolveLogoPrefix, getLogoRadius } from '@src/core/utils';

describe('resolveLogoPrefix', () => {
  it('returns wallet ID as prefix for standard wallets', () => {
    expect(resolveLogoPrefix(WalletId.MetaMask)).toBe('metamask');
    expect(resolveLogoPrefix(WalletId.Phantom)).toBe('phantom');
    expect(resolveLogoPrefix(WalletId.CoinbaseWallet)).toBe('coinbase-wallet');
    expect(resolveLogoPrefix(WalletId.WalletConnect)).toBe('walletconnect');
    expect(resolveLogoPrefix(WalletId.Rabby)).toBe('rabby');
    expect(resolveLogoPrefix(WalletId.AppKit)).toBe('appkit');
  });

  it('returns coinbase-wallet prefix for Email wallet', () => {
    expect(resolveLogoPrefix(WalletId.Email)).toBe('coinbase-wallet');
  });
});

describe('getLogoRadius', () => {
  it('returns correct rem string for default slot (sm)', () => {
    expect(getLogoRadius('none')).toBe('0rem');
    expect(getLogoRadius('sm')).toBe('0.375rem');
    expect(getLogoRadius('md')).toBe('0.625rem');
    expect(getLogoRadius('lg')).toBe('0.875rem');
    expect(getLogoRadius('xl')).toBe('1.125rem');
  });

  it('returns correct rem values for each token and slot combination', () => {
    const tokens = ['none', 'sm', 'md', 'lg', 'xl'] as const;
    const slots = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    tokens.forEach((token) => {
      slots.forEach((slot) => {
        const expected = `${BORDER_RADIUS_SCALES[token][slot] / 16}rem`;
        expect(getLogoRadius(token, slot)).toBe(expected);
      });
    });
  });

  it('matches documented scale values', () => {
    // Verify against the style guide documentation (converted to rem)
    expect(getLogoRadius('xl', 'xs')).toBe('0.625rem'); // 10px
    expect(getLogoRadius('xl', 'sm')).toBe('1.125rem'); // 18px
    expect(getLogoRadius('xl', 'md')).toBe('1.625rem'); // 26px
    expect(getLogoRadius('xl', 'lg')).toBe('2.125rem'); // 34px
    expect(getLogoRadius('xl', 'xl')).toBe('2.625rem'); // 42px
  });
});
