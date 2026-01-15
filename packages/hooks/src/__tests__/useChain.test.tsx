import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AurumProvider } from '@src/AurumProvider';
import { useChain } from '@src/hooks/useChain';
import { createMockAurum, resetMocks } from './setup';
import type { ReactNode } from 'react';
import type { Aurum } from '@aurum/sdk';

describe('useChain', () => {
  beforeEach(() => {
    resetMocks();
  });

  const createWrapper = (aurum: Aurum) => {
    return ({ children }: { children: ReactNode }) => <AurumProvider aurum={aurum}>{children}</AurumProvider>;
  };

  it('returns null chainId initially', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
      getChainId: () => Promise.reject(new Error('Not connected')),
    });

    const { result } = renderHook(() => useChain(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.chainId).toBeNull();
    });
  });

  it('returns chainId when connected', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(true),
      getChainId: () => Promise.resolve(1),
    });

    const { result } = renderHook(() => useChain(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.chainId).toBe(1);
    });
  });

  it('provides switchChain function', async () => {
    const switchChainMock = vi.fn().mockResolvedValue(undefined);
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(true),
      getChainId: () => Promise.resolve(1),
      switchChain: switchChainMock,
    });

    const { result } = renderHook(() => useChain(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.chainId).toBe(1);
    });

    await act(async () => {
      await result.current.switchChain(137);
    });

    expect(switchChainMock).toHaveBeenCalledWith(137, undefined);
  });

  it('sets error on switchChain failure', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(true),
      getChainId: () => Promise.resolve(1),
      switchChain: () => Promise.reject(new Error('Chain not supported')),
    });

    const { result } = renderHook(() => useChain(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await waitFor(() => {
      expect(result.current.chainId).toBe(1);
    });

    await act(async () => {
      try {
        await result.current.switchChain(999);
      } catch {
        // Expected
      }
    });

    expect(result.current.error?.message).toBe('Chain not supported');
  });
});
