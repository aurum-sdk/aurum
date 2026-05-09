import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WalletId, WalletName } from '@aurum-sdk/types';
import type { WalletAdapter, WalletAdapterManifest } from '@src/types/internal';
import { AdapterLoadError } from '@src/errors';
import { loadAdapter, peekAdapter, clearAdapterCache } from '@src/utils/walletAdapterCache';

const fakeAdapter = (id: WalletId): WalletAdapter =>
  ({
    id,
    name: id as unknown as WalletName,
    icon: '',
    hide: false,
    downloadUrl: null,
    wcDeepLinkUrl: null,
    isInstalled: () => true,
    getProvider: () => null,
    connect: vi.fn(),
    tryRestoreConnection: vi.fn(),
    disconnect: vi.fn(),
    onAccountsChanged: vi.fn(),
    removeListeners: vi.fn(),
  }) as unknown as WalletAdapter;

const makeManifest = (id: WalletId, load: WalletAdapterManifest['load']): WalletAdapterManifest => ({
  id,
  name: id as unknown as WalletName,
  icon: '',
  hide: false,
  downloadUrl: null,
  wcDeepLinkUrl: null,
  isInstalled: () => true,
  load,
});

describe('walletAdapterCache', () => {
  beforeEach(() => {
    clearAdapterCache();
  });

  it('caches a successful load so subsequent calls reuse the adapter', async () => {
    const load = vi.fn(async () => fakeAdapter(WalletId.MetaMask));
    const manifest = makeManifest(WalletId.MetaMask, load);

    const a = await loadAdapter(manifest);
    const b = await loadAdapter(manifest);

    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('deduplicates concurrent loads of the same manifest', async () => {
    let resolveLoad!: (adapter: WalletAdapter) => void;
    const load = vi.fn(
      () =>
        new Promise<WalletAdapter>((resolve) => {
          resolveLoad = resolve;
        }),
    );
    const manifest = makeManifest(WalletId.WalletConnect, load);

    const p1 = loadAdapter(manifest);
    const p2 = loadAdapter(manifest);
    expect(load).toHaveBeenCalledTimes(1);

    resolveLoad(fakeAdapter(WalletId.WalletConnect));
    const [a, b] = await Promise.all([p1, p2]);
    expect(a).toBe(b);
  });

  it('wraps load failures in AdapterLoadError and clears the cache so retry is possible', async () => {
    const inner = new Error('chunk 404');
    const load = vi.fn(async () => {
      throw inner;
    });
    const manifest = makeManifest(WalletId.Phantom, load);

    await expect(loadAdapter(manifest)).rejects.toBeInstanceOf(AdapterLoadError);
    await expect(loadAdapter(manifest)).rejects.toMatchObject({
      code: 'ADAPTER_LOAD_FAILED',
      walletId: WalletId.Phantom,
      cause: inner,
    });

    // Two attempts means the cache evicted after the first failure.
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('peekAdapter returns undefined when no load has been triggered', () => {
    expect(peekAdapter(WalletId.Brave)).toBeUndefined();
  });

  it('peekAdapter returns the cached promise once a load has been triggered', async () => {
    const adapter = fakeAdapter(WalletId.Brave);
    const load = vi.fn(async () => adapter);
    const manifest = makeManifest(WalletId.Brave, load);

    void loadAdapter(manifest);
    const peeked = peekAdapter(WalletId.Brave);
    expect(peeked).toBeDefined();
    await expect(peeked).resolves.toBe(adapter);
  });
});
