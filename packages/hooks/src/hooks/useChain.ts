'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Chain } from 'viem';
import { useAurumContext } from '@src/AurumContext';

/**
 * Access chain information and switch chains.
 *
 * @example
 * ```tsx
 * import { sepolia } from 'viem/chains';
 *
 * const { chainId, switchChain, error } = useChain();
 *
 * return (
 *   <div>
 *     <p>Chain ID: {chainId}</p>
 *     <button onClick={() => switchChain(sepolia.id, sepolia)}>
 *       Switch to Sepolia
 *     </button>
 *   </div>
 * );
 * ```
 */
export function useChain() {
  const { aurum, isReady } = useAurumContext();
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fetch initial chain ID when ready
  useEffect(() => {
    if (!isReady) return;

    const fetchChainId = async () => {
      try {
        const id = await aurum.getChainId();
        setChainId(id);
      } catch {
        // Not connected or error fetching chain ID
        setChainId(null);
      }
    };

    fetchChainId();

    // Listen for chain changes
    const handleChainChanged = (newChainId: number | string) => {
      setChainId(Number(newChainId));
    };

    aurum.rpcProvider?.on?.('chainChanged', handleChainChanged);

    return () => {
      aurum.rpcProvider?.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [aurum, isReady]);

  const switchChain = useCallback(
    async (targetChainId: number | string | `0x${string}`, chain?: Chain) => {
      if (!targetChainId) {
        throw new Error('chainId is required');
      }
      setError(null);

      try {
        await aurum.switchChain(targetChainId as `0x${string}` | string | number, chain);
        // Chain ID will be updated via the chainChanged event listener
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to switch chain');
        setError(error);
        throw error;
      }
    },
    [aurum],
  );

  return { chainId, switchChain, error };
}
