import type { WalletId } from '@aurum-sdk/types';
import type { WalletAdapter, WalletAdapterManifest } from '@src/types/internal';
import { AdapterLoadError } from '@src/errors';

const cache = new Map<WalletId, Promise<WalletAdapter>>();

/**
 * Resolves a manifest to its loaded adapter. Subsequent calls return the cached promise so
 * concurrent click + headless calls only download the chunk once.
 *
 * Failed loads are evicted so the next call can retry — covers transient chunk 404s after
 * a redeploy and intermittent network drops.
 */
export async function loadAdapter(manifest: WalletAdapterManifest): Promise<WalletAdapter> {
  const existing = cache.get(manifest.id);
  if (existing) return existing;

  const promise = manifest.load().catch((err) => {
    cache.delete(manifest.id);
    throw new AdapterLoadError(manifest.id, err);
  });
  cache.set(manifest.id, promise);
  return promise;
}

/** Returns the cached promise without triggering a load. */
export function peekAdapter(walletId: WalletId): Promise<WalletAdapter> | undefined {
  return cache.get(walletId);
}

/** Test helper. */
export function clearAdapterCache(): void {
  cache.clear();
}
