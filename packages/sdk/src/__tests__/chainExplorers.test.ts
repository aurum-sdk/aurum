import { describe, it, expect } from 'vitest';
import { getExplorerAddressUrl } from '@src/utils/chainExplorers';

describe('getExplorerAddressUrl', () => {
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678';

  describe('Ethereum', () => {
    it('returns etherscan URL for mainnet', () => {
      expect(getExplorerAddressUrl(1, testAddress)).toBe(`https://etherscan.io/address/${testAddress}`);
    });

    it('returns sepolia etherscan URL for Sepolia', () => {
      expect(getExplorerAddressUrl(11155111, testAddress)).toBe(`https://sepolia.etherscan.io/address/${testAddress}`);
    });
  });

  describe('Polygon', () => {
    it('returns polygonscan URL for mainnet', () => {
      expect(getExplorerAddressUrl(137, testAddress)).toBe(`https://polygonscan.com/address/${testAddress}`);
    });

    it('returns amoy polygonscan URL for Amoy testnet', () => {
      expect(getExplorerAddressUrl(80002, testAddress)).toBe(`https://amoy.polygonscan.com/address/${testAddress}`);
    });
  });

  describe('Base', () => {
    it('returns basescan URL for mainnet', () => {
      expect(getExplorerAddressUrl(8453, testAddress)).toBe(`https://basescan.org/address/${testAddress}`);
    });

    it('returns sepolia basescan URL for Base Sepolia', () => {
      expect(getExplorerAddressUrl(84532, testAddress)).toBe(`https://sepolia.basescan.org/address/${testAddress}`);
    });
  });

  describe('Arbitrum', () => {
    it('returns arbiscan URL for mainnet', () => {
      expect(getExplorerAddressUrl(42161, testAddress)).toBe(`https://arbiscan.io/address/${testAddress}`);
    });
  });

  describe('Optimism', () => {
    it('returns optimistic etherscan URL for mainnet', () => {
      expect(getExplorerAddressUrl(10, testAddress)).toBe(`https://optimistic.etherscan.io/address/${testAddress}`);
    });
  });

  describe('unsupported chains', () => {
    it('returns null for unknown chain ID', () => {
      expect(getExplorerAddressUrl(999999, testAddress)).toBeNull();
    });
  });
});
