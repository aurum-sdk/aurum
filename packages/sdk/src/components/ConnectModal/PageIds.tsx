import React from 'react';

import { SelectWalletPage } from '@src/components/ConnectModal/SelectWallet';
import { ConnectionStatusPage } from '@src/components/ConnectModal/ConnectionStatus';
import { QRCodePage } from '@src/components/ConnectModal/QRCodePage';
import { AllWalletsPage } from '@src/components/ConnectModal/AllWallets';
import { DownloadWalletPage } from '@src/components/ConnectModal/DownloadWalletPage';
import { EmailVerifyOTP } from '@src/components/ConnectModal/EmailVerifyOtp';
import { ConnectionStatusMobilePage } from '@src/components/ConnectModal/ConnectionStatus/Mobile';
import { ConfigErrorPage } from '@src/components/ConnectModal/ConfigErrorPage';

export type PageIdType = (typeof PAGE_IDS)[keyof typeof PAGE_IDS];

export const PAGE_IDS = {
  SELECT_WALLET: 'select-wallet',
  ALL_WALLETS: 'all-wallets',
  QR_CODE: 'qr-code',
  MOBILE_DEEP_LINK: 'mobile-deep-link',
  DOWNLOAD_WALLET: 'download-wallet',
  CONNECTING: 'connecting',
  EMAIL_VERIFY_OTP: 'email-verify-otp',
  CONFIG_ERROR: 'config-error',
} as const;

export const PAGE_COMPONENTS: Record<PageIdType, React.ReactNode> = {
  [PAGE_IDS.SELECT_WALLET]: <SelectWalletPage />,
  [PAGE_IDS.ALL_WALLETS]: <AllWalletsPage />,
  [PAGE_IDS.QR_CODE]: <QRCodePage />,
  [PAGE_IDS.MOBILE_DEEP_LINK]: <ConnectionStatusMobilePage />,
  [PAGE_IDS.DOWNLOAD_WALLET]: <DownloadWalletPage />,
  [PAGE_IDS.CONNECTING]: <ConnectionStatusPage />,
  [PAGE_IDS.EMAIL_VERIFY_OTP]: <EmailVerifyOTP />,
  [PAGE_IDS.CONFIG_ERROR]: <ConfigErrorPage />,
};
