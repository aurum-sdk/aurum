/**
 * EIP-1193 Connect Info
 */
export interface ProviderConnectInfo {
  chainId: string;
}

/**
 * EIP-1193 Provider RPC Error
 */
export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
}

export interface AurumRpcProvider {
  /**
   * Sends a JSON-RPC request to the provider.
   * @param args - The request arguments (method and params)
   */
  request<T = unknown>(args: { method: string; params?: unknown[] | object }): Promise<T>;

  /**
   * EIP-1193 event interface
   */
  on?(eventName: 'connect', listener: (connectInfo: ProviderConnectInfo) => void): void;
  on?(eventName: 'disconnect', listener: (error: ProviderRpcError) => void): void;
  on?(eventName: 'chainChanged', listener: (chainId: string) => void): void;
  on?(eventName: 'accountsChanged', listener: (accounts: string[]) => void): void;
  on?(eventName: string, listener: (...args: unknown[]) => void): void;

  removeListener?(eventName: 'connect', listener: (connectInfo: ProviderConnectInfo) => void): void;
  removeListener?(eventName: 'disconnect', listener: (error: ProviderRpcError) => void): void;
  removeListener?(eventName: 'chainChanged', listener: (chainId: string) => void): void;
  removeListener?(eventName: 'accountsChanged', listener: (accounts: string[]) => void): void;
  removeListener?(eventName: string, listener: (...args: unknown[]) => void): void;

  emit?(eventName: string, ...args: unknown[]): boolean;

  /**
   * EIP-1193 required properties for full compatibility
   */
  readonly isConnected?: boolean;
  readonly chainId?: string;
  readonly networkVersion?: string;
  readonly selectedAddress?: string | null;
}
