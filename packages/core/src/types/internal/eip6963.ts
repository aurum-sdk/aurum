import { AurumRpcProvider } from '@aurum-sdk/types';

/**
 * EIP-6963: Multi Injected Provider Discovery
 * https://eips.ethereum.org/EIPS/eip-6963
 *
 * These types define the standard for wallet provider discovery,
 * allowing multiple wallet extensions to announce their presence
 * without conflicting on window.ethereum.
 */

/** Provider metadata announced via EIP-6963 */
export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

/** Provider detail object containing both info and the actual provider */
export interface EIP6963ProviderDetail<T extends AurumRpcProvider = AurumRpcProvider> {
  info: EIP6963ProviderInfo;
  provider: T;
}

/** Custom event fired when a provider announces itself */
export interface EIP6963AnnounceProviderEvent<T extends AurumRpcProvider = AurumRpcProvider> extends Event {
  detail: EIP6963ProviderDetail<T>;
}
