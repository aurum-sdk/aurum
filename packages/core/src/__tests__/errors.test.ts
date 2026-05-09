import { describe, it, expect } from 'vitest';
import {
  AdapterLoadError,
  AurumError,
  ChainNotSupportedError,
  ChainSwitchRejectedError,
  ConnectionError,
  InvalidConfigError,
  UserRejectedError,
  WalletExcludedError,
  WalletNotConfiguredError,
  WalletNotInstalledError,
  normalizeError,
} from '@src/errors';

describe('error classes', () => {
  it('all subclasses extend AurumError and expose a stable code', () => {
    const cases: Array<[AurumError, string]> = [
      [new UserRejectedError('x'), 'USER_REJECTED'],
      [new ChainSwitchRejectedError('x'), 'CHAIN_SWITCH_REJECTED'],
      [new WalletNotInstalledError('metamask'), 'WALLET_NOT_INSTALLED'],
      [new WalletNotConfiguredError('email'), 'WALLET_NOT_CONFIGURED'],
      [new WalletExcludedError('coinbase'), 'WALLET_EXCLUDED'],
      [new ChainNotSupportedError('x'), 'CHAIN_NOT_SUPPORTED'],
      [new InvalidConfigError('x'), 'INVALID_CONFIG'],
      [new ConnectionError('x'), 'CONNECTION_FAILED'],
      [new AdapterLoadError('metamask'), 'ADAPTER_LOAD_FAILED'],
    ];

    for (const [err, code] of cases) {
      expect(err).toBeInstanceOf(AurumError);
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe(code);
      expect(err.name).toBe(err.constructor.name);
    }
  });

  it('wallet-id errors expose the walletId field in message and property', () => {
    const err = new WalletNotInstalledError('phantom');
    expect(err.walletId).toBe('phantom');
    expect(err.message).toContain('phantom');
  });

  it('AdapterLoadError preserves walletId and cause', () => {
    const inner = new Error('chunk load failed');
    const err = new AdapterLoadError('metamask', inner);
    expect(err.walletId).toBe('metamask');
    expect(err.message).toContain('metamask');
    expect(err.cause).toBe(inner);
  });
});

describe('normalizeError', () => {
  it('passes AurumError instances through unchanged', () => {
    const original = new UserRejectedError('nope');
    expect(normalizeError(original)).toBe(original);
  });

  it('maps EIP-1193 code 4001 to UserRejectedError', () => {
    const err = normalizeError({ code: 4001, message: 'user rejected the request' });
    expect(err).toBeInstanceOf(UserRejectedError);
    expect(err.code).toBe('USER_REJECTED');
    expect(err.cause).toEqual({ code: 4001, message: 'user rejected the request' });
  });

  it('maps string "4001" code to UserRejectedError', () => {
    const err = normalizeError({ code: '4001', message: 'denied' });
    expect(err).toBeInstanceOf(UserRejectedError);
  });

  it('maps ethers-style ACTION_REJECTED to UserRejectedError', () => {
    const err = normalizeError({ code: 'ACTION_REJECTED', message: 'rejected in wallet' });
    expect(err).toBeInstanceOf(UserRejectedError);
  });

  it('maps rejection during switchChain to ChainSwitchRejectedError', () => {
    const err = normalizeError({ code: 4001, message: 'no' }, { operation: 'switchChain' });
    expect(err).toBeInstanceOf(ChainSwitchRejectedError);
    expect(err.code).toBe('CHAIN_SWITCH_REJECTED');
  });

  it('message regex fallback catches "user rejected"', () => {
    const err = normalizeError({ message: 'User rejected signature' });
    expect(err).toBeInstanceOf(UserRejectedError);
  });

  it('message regex fallback catches "user denied"', () => {
    const err = normalizeError({ message: 'user denied the transaction' });
    expect(err).toBeInstanceOf(UserRejectedError);
  });

  it('message regex fallback catches "user cancelled"', () => {
    const err = normalizeError({ message: 'user cancelled request' });
    expect(err).toBeInstanceOf(UserRejectedError);
  });

  it('falls through to ConnectionError for unknown shapes', () => {
    const err = normalizeError({ code: 9999, message: 'something else exploded' });
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.code).toBe('CONNECTION_FAILED');
    expect(err.message).toBe('something else exploded');
  });

  it('handles non-object inputs without throwing', () => {
    const err = normalizeError('boom');
    expect(err).toBeInstanceOf(ConnectionError);
    expect(err.message).toBe('Unknown error');
    expect(err.cause).toBe('boom');
  });

  it('preserves the original error as cause', () => {
    const raw = new Error('original');
    const err = normalizeError(raw);
    expect(err.cause).toBe(raw);
  });
});
