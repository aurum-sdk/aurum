export interface EmailAuthStartResult {
  flowId: string;
}

export interface EmailAuthVerifyResult {
  address: `0x${string}`;
  email: string;
  isNewUser: boolean;
}

export interface WalletConnectSessionResult {
  uri: string;
  waitForConnection: () => Promise<`0x${string}`>;
}
