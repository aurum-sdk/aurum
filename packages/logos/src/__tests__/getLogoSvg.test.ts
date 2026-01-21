import { describe, it, expect } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';
import { getLogoSvg } from '@src/core/getLogoSvg';

describe('getLogoSvg', () => {
  describe('with WalletId directly', () => {
    it('returns SVG string for valid wallet ID with default variant', () => {
      const svg = getLogoSvg(WalletId.MetaMask);
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
    });

    it('returns SVG string for each variant', () => {
      const variants = ['icon', 'brand', 'black', 'white'] as const;
      variants.forEach((variant) => {
        const svg = getLogoSvg(WalletId.MetaMask, variant);
        expect(svg).toBeTruthy();
        expect(svg).toContain('<svg');
      });
    });

    it('returns SVG for all supported wallet IDs', () => {
      const walletIds = [
        WalletId.MetaMask,
        WalletId.CoinbaseWallet,
        WalletId.Phantom,
        WalletId.WalletConnect,
        WalletId.Rabby,
        WalletId.Ledger,
      ];

      walletIds.forEach((id) => {
        const svg = getLogoSvg(id);
        expect(svg, `Missing logo for ${id}`).toBeTruthy();
        expect(svg).toContain('<svg');
      });
    });

    it('returns SVG for appkit via string prefix', () => {
      // AppKit logos are still accessible via string prefix
      const svg = getLogoSvg('appkit' as WalletId, 'brand');
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
    });
  });

  describe('with options object', () => {
    it('returns SVG using id option', () => {
      const svg = getLogoSvg({ id: WalletId.Phantom, variant: 'brand' });
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
    });

    it('returns SVG using name option', () => {
      const svg = getLogoSvg({ name: WalletName.MetaMask, variant: 'icon' });
      expect(svg).toBeTruthy();
      expect(svg).toContain('<svg');
    });

    it('defaults to icon variant when not specified', () => {
      const svg = getLogoSvg({ id: WalletId.Rabby });
      const iconSvg = getLogoSvg(WalletId.Rabby, 'icon');
      expect(svg).toBe(iconSvg);
    });
  });

  describe('edge cases', () => {
    it('returns null for empty options', () => {
      const svg = getLogoSvg({});
      expect(svg).toBeNull();
    });

    it('handles Email wallet ID (uses Coinbase logo)', () => {
      const emailSvg = getLogoSvg(WalletId.Email);
      const coinbaseSvg = getLogoSvg(WalletId.CoinbaseWallet);
      expect(emailSvg).toBe(coinbaseSvg);
    });
  });
});
