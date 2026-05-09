import type { AurumRpcProvider } from '@aurum-sdk/types';
import type { EIP6963AnnounceProviderEvent } from '@src/types/internal';

const announced = new Map<string, AurumRpcProvider>();
let started = false;

/**
 * Subscribe to EIP-6963 announcements once. Idempotent; safe to call from multiple manifests.
 *
 * Manifests use this so `isInstalled()` can return `true` for extension wallets without
 * having to construct (and pull in the chunk for) the heavy adapter.
 */
export function startEIP6963Discovery(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  window.addEventListener('eip6963:announceProvider', (event: Event) => {
    const detail = (event as EIP6963AnnounceProviderEvent).detail;
    if (detail?.info?.rdns) {
      announced.set(detail.info.rdns, detail.provider);
    }
  });
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function getAnnouncedProvider(rdns: string): AurumRpcProvider | undefined {
  return announced.get(rdns);
}
