import type { AurumRpcProvider } from '@aurum-sdk/types';

/**
 * EIP-1193 compliant provider error.
 * @see https://eips.ethereum.org/EIPS/eip-1193#provider-errors
 */
export class ProviderRpcError extends Error {
  readonly code: number;
  readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ProviderRpcError';
    this.code = code;
    this.data = data;
  }
}

/**
 * EIP-1193 Provider Error Codes
 * @see https://eips.ethereum.org/EIPS/eip-1193#provider-errors
 */
export const ProviderErrorCode = {
  USER_REJECTED: 4001, // User rejected the request
  UNAUTHORIZED: 4100, // The requested account/method has not been authorized
  UNSUPPORTED_METHOD: 4200, // The provider does not support the requested method
  DISCONNECTED: 4900, // The provider is disconnected from all chains
  CHAIN_DISCONNECTED: 4901, // The provider is not connected to the requested chain
} as const;

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
          throw new ProviderRpcError(
            ProviderErrorCode.DISCONNECTED,
            'No wallet connection available. Please use aurum.connect() instead.',
          );
        }

      // Chain/network information
      case 'eth_chainId':
        return this.chainId as T;

      case 'net_version':
        return this.networkVersion as T;

      // Default case for rest of methods
      default:
        throw new ProviderRpcError(
          ProviderErrorCode.DISCONNECTED,
          `Method ${method} requires an active wallet connection. Please connect a wallet first.`,
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
