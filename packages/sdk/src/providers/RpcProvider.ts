import type { AurumRpcProvider } from '@aurum/types';

/**
 * RpcProvider acts as a default provider when no wallet is connected.
 * It accepts eth_requestAccounts to prompt the wallet modal to connect.
 * It accepts eth_accounts and returns [].
 * It rejects all other methods.
 */
export class RpcProvider implements AurumRpcProvider {
  readonly isConnected = false;
  readonly chainId = '0x1';
  readonly networkVersion = '1';
  readonly selectedAddress = null;

  private handleConnect: () => Promise<string>;

  constructor(handleConnect: () => Promise<string>) {
    this.handleConnect = handleConnect;
  }

  async request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T> {
    const { method } = args;

    switch (method) {
      // Account methods - return empty when not connected
      case 'eth_accounts':
        return [] as T;

      // Trigger connection flow
      case 'enable':
      case 'eth_requestAccounts':
        if (this.handleConnect) {
          const address = await this.handleConnect();
          return [address] as T;
        } else {
          throw new Error('No wallet connection available. Please use aurum.connect() instead.');
        }

      // Chain/network information
      case 'eth_chainId':
        return this.chainId as T;

      case 'net_version':
        return this.networkVersion as T;

      // Default case for rest of methods
      default:
        throw new Error(
          `Method ${method} requires an active connection to a JSON-RPC provider. Please connect a wallet.`,
        );
    }
  }

  // No-op: disconnected provider doesn't emit events
  on(): void {}

  // No-op: disconnected provider doesn't manage listeners
  removeListener(): void {}

  // No listeners to notify in disconnected state
  emit(): boolean {
    return false;
  }
}
