import { describe, it, expect } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';
import { getLogoDataUri } from '@src/core/getLogoDataUri';

describe('getLogoDataUri', () => {
  describe('with WalletId directly', () => {
    it('returns valid data URI for wallet ID', () => {
      const uri = getLogoDataUri(WalletId.MetaMask);
      expect(uri).toBeTruthy();
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
    });

    it('returns URI-encoded SVG content', () => {
      const uri = getLogoDataUri(WalletId.Phantom, 'brand');
      expect(uri).toBeTruthy();
      expect(uri).toContain(encodeURIComponent('<svg'));
    });

    it('returns data URI for each variant', () => {
      const variants = ['icon', 'brand', 'black', 'white'] as const;
      variants.forEach((variant) => {
        const uri = getLogoDataUri(WalletId.CoinbaseWallet, variant);
        expect(uri).toBeTruthy();
        expect(uri).toMatch(/^data:image\/svg\+xml,/);
      });
    });
  });

  describe('with options object', () => {
    it('returns data URI using id option', () => {
      const uri = getLogoDataUri({ id: WalletId.Rabby, variant: 'white' });
      expect(uri).toBeTruthy();
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
    });

    it('returns data URI using name option', () => {
      const uri = getLogoDataUri({ name: WalletName.WalletConnect });
      expect(uri).toBeTruthy();
      expect(uri).toMatch(/^data:image\/svg\+xml,/);
    });
  });

  describe('edge cases', () => {
    it('returns null for empty options', () => {
      const uri = getLogoDataUri({});
      expect(uri).toBeNull();
    });

    it('can be used directly in img src', () => {
      const uri = getLogoDataUri(WalletId.MetaMask, 'brand');
      // Verify it's a valid data URI that browsers accept
      expect(uri).toMatch(/^data:image\/svg\+xml,%3Csvg/);
    });
  });
});
