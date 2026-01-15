import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AurumProvider } from '@src/AurumProvider';
import { useDisconnect } from '@src/hooks/useDisconnect';
import { createMockAurum, resetMocks } from './setup';
import type { ReactNode } from 'react';
import type { Aurum } from '@aurum-sdk/core';

describe('useDisconnect', () => {
  beforeEach(() => {
    resetMocks();
  });

  const createWrapper = (aurum: Aurum) => {
    return ({ children }: { children: ReactNode }) => <AurumProvider aurum={aurum}>{children}</AurumProvider>;
  };

  it('calls aurum.disconnect when disconnect is invoked', async () => {
    const disconnectMock = vi.fn().mockResolvedValue(undefined);
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
      disconnect: disconnectMock,
    });

    const { result } = renderHook(() => useDisconnect(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await act(async () => {
      await result.current.disconnect();
    });

    expect(disconnectMock).toHaveBeenCalledOnce();
  });

  it('propagates errors from disconnect failure', async () => {
    const disconnectError = new Error('Disconnect failed');
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(true),
      disconnect: () => Promise.reject(disconnectError),
    });

    const { result } = renderHook(() => useDisconnect(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    await act(async () => {
      await expect(result.current.disconnect()).rejects.toThrow('Disconnect failed');
    });
  });
});
