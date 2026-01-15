/**
 * Block explorer URLs for common EVM chains
 */
const CHAIN_EXPLORERS: Record<number, string> = {
  // Ethereum
  1: 'https://etherscan.io',
  11155111: 'https://sepolia.etherscan.io',

  // Polygon
  137: 'https://polygonscan.com',
  80002: 'https://amoy.polygonscan.com',

  // Arbitrum
  42161: 'https://arbiscan.io',
  421614: 'https://sepolia.arbiscan.io',

  // Optimism
  10: 'https://optimistic.etherscan.io',
  11155420: 'https://sepolia-optimism.etherscan.io',

  // Base
  8453: 'https://basescan.org',
  84532: 'https://sepolia.basescan.org',

  // BNB Smart Chain
  56: 'https://bscscan.com',
  97: 'https://testnet.bscscan.com',

  // Avalanche
  43114: 'https://snowtrace.io',
  43113: 'https://testnet.snowtrace.io',

  // Fantom
  250: 'https://ftmscan.com',
  4002: 'https://testnet.ftmscan.com',

  // zkSync
  324: 'https://explorer.zksync.io',
  300: 'https://sepolia.explorer.zksync.io',
};

/**
 * Get the block explorer URL for an address on a given chain
 * @returns The full explorer URL, or null if chain is not supported
 */
export function getExplorerAddressUrl(chainId: number, address: string): string | null {
  const base = CHAIN_EXPLORERS[chainId];
  return base ? `${base}/address/${address}` : null;
}
