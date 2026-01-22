export const WALLETCONNECT_NAMESPACE = {
  eip155: {
    methods: [
      // Transaction methods
      'eth_sendTransaction',
      'eth_signTransaction',
      'eth_sendRawTransaction',
      // Signing methods
      'eth_sign',
      'personal_sign',
      'eth_signTypedData',
      'eth_signTypedData_v3',
      'eth_signTypedData_v4',
      // Account methods
      'eth_accounts',
      'eth_requestAccounts',
      // Chain management
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
      // Permissions (EIP-2255)
      'wallet_requestPermissions',
      'wallet_getPermissions',
    ],
    chains: [
      // Ethereum
      'eip155:1', // Mainnet
      'eip155:11155111', // Sepolia
      // Base
      'eip155:8453', // Mainnet
      'eip155:84532', // Sepolia
      // Optimism
      'eip155:10', // Mainnet
      'eip155:11155420', // Sepolia
      // Arbitrum
      'eip155:42161', // Mainnet
      'eip155:421614', // Sepolia
      // BNB Chain
      'eip155:56', // Mainnet
      'eip155:97', // Testnet
      // Polygon
      'eip155:137', // Mainnet
      'eip155:80002', // Amoy
      // Fantom
      'eip155:250', // Mainnet
      'eip155:4002', // Testnet
      // Linea
      'eip155:59144', // Mainnet
      'eip155:59141', // Sepolia
      // Gnosis
      'eip155:100', // Mainnet
      'eip155:10200', // Chiado
      // Polygon zkEVM
      'eip155:1101', // Mainnet
      'eip155:2442', // Cardona
      // Avalanche C-Chain
      'eip155:43114', // Mainnet
      'eip155:43113', // Fuji
    ],
    events: ['chainChanged', 'accountsChanged'],
  },
};
