'use client';

import { useCallback } from 'react';
import { useAurumContext } from '@src/AurumContext';

/**
 * Disconnect the current wallet.
 *
 * @example
 * ```tsx
 * const { disconnect } = useDisconnect();
 *
 * return <button onClick={disconnect}>Disconnect</button>;
 * ```
 */
export function useDisconnect() {
  const { aurum } = useAurumContext();

  const disconnect = useCallback(async () => {
    await aurum.disconnect();
  }, [aurum]);

  return { disconnect };
}
