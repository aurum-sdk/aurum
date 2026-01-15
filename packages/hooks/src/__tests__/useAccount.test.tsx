import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AurumProvider } from '@src/AurumProvider';
import { useAccount } from '@src/hooks/useAccount';
import { createMockAurum, resetMocks } from './setup';
import { WalletId, WalletName } from '@aurum-sdk/types';
import type { ReactNode } from 'react';
import type { Aurum } from '@aurum-sdk/core';

describe('useAccount', () => {
  beforeEach(() => {
    resetMocks();
  });

  const createWrapper = (aurum: Aurum) => {
    return ({ children }: { children: ReactNode }) => <AurumProvider aurum={aurum}>{children}</AurumProvider>;
  };

  it('returns initial state while initializing', () => {
    const aurum = createMockAurum({
      getUserInfo: () => new Promise(() => {}), // Never resolves
      isConnected: () => new Promise(() => {}),
    });

    const { result } = renderHook(() => useAccount(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    expect(result.current.isInitializing).toBe(true);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.publicAddress).toBeUndefined();
  });

  it('returns connected state after initialization', async () => {
    const aurum = createMockAurum({
      getUserInfo: () =>
        Promise.resolve({
          publicAddress: '0x1234567890abcdef',
          walletName: WalletName.MetaMask,
          walletId: WalletId.MetaMask,
        }),
      isConnected: () => Promise.resolve(true),
    });

    const { result } = renderHook(() => useAccount(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.publicAddress).toBe('0x1234567890abcdef');
    expect(result.current.walletName).toBe(WalletName.MetaMask);
  });

  it('returns disconnected state when not connected', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
    });

    const { result } = renderHook(() => useAccount(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.isInitializing).toBe(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.publicAddress).toBeUndefined();
  });
});
