'use client';

import { useAurumContext } from '@src/AurumContext';

/**
 * Access the raw Aurum SDK instance.
 *
 * @example
 * ```tsx
 * const { aurum, isReady } = useAurum();
 *
 * if (isReady) {
 *   const chainId = await aurum.getChainId();
 * }
 * ```
 */
export function useAurum() {
  const { aurum, isReady } = useAurumContext();
  return { aurum, isReady };
}
