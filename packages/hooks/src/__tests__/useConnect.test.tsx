import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AurumProvider } from '@src/AurumProvider';
import { useConnect } from '@src/hooks/useConnect';
import { createMockAurum, resetMocks } from './setup';
import type { ReactNode } from 'react';
import type { Aurum } from '@aurum-sdk/core';

describe('useConnect', () => {
  beforeEach(() => {
    resetMocks();
  });

  const createWrapper = (aurum: Aurum) => {
    return ({ children }: { children: ReactNode }) => <AurumProvider aurum={aurum}>{children}</AurumProvider>;
  };

  it('returns initial state', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
    });

    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.connect).toBe('function');
  });

  it('sets isPending true while connecting', async () => {
    let resolveConnect: (value: string) => void;
    const connectPromise = new Promise<string>((resolve) => {
      resolveConnect = resolve;
    });

    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
      connect: () => connectPromise,
    });

    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    act(() => {
      result.current.connect();
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      resolveConnect!('0x123');
    });

    expect(result.current.isPending).toBe(false);
  });

  it('sets error on connection failure', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
      connect: () => Promise.reject(new Error('User rejected')),
    });

    const { result } = renderHook(() => useConnect(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await act(async () => {
      try {
        await result.current.connect();
      } catch {
        // Expected
      }
    });

    expect(result.current.error?.message).toBe('User rejected');
    expect(result.current.isPending).toBe(false);
  });
});
