import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AurumProvider } from '@src/AurumProvider';
import { useAurum } from '@src/hooks/useAurum';
import { createMockAurum, resetMocks } from './setup';
import type { ReactNode } from 'react';
import type { Aurum } from '@aurum-sdk/core';

describe('useAurum', () => {
  beforeEach(() => {
    resetMocks();
  });

  const createWrapper = (aurum: Aurum) => {
    return ({ children }: { children: ReactNode }) => <AurumProvider aurum={aurum}>{children}</AurumProvider>;
  };

  it('returns aurum instance', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
    });

    const { result } = renderHook(() => useAurum(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    expect(result.current.aurum).toBe(aurum);
  });

  it('returns isReady as false initially, then true after SDK ready', async () => {
    const aurum = createMockAurum({
      getUserInfo: () => Promise.resolve(null),
      isConnected: () => Promise.resolve(false),
    });

    const { result } = renderHook(() => useAurum(), {
      wrapper: createWrapper(aurum as unknown as Aurum),
    });

    // Initially not ready, then becomes ready
    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });
  });
});
