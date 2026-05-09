import React, { createContext, useContext, useState } from 'react';
import { SignInWithEmailResult } from '@coinbase/cdp-core';
import { WalletAdapter, WalletAdapterManifest, WalletConnectionResult } from '@src/types/internal';
import { PAGE_IDS, PageIdType } from '@src/components/ConnectModal/PageIds';
import { AurumRpcProvider } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';
import { isConfigError } from '@src/utils/isConfigError';
import { loadAdapter } from '@src/utils/walletAdapterCache';

export interface EmailAuthState {
  email: string;
  authResult: SignInWithEmailResult | null;
  step: 'email' | 'otp' | 'connecting' | 'success';
}

interface EmailAuthProviderProps {
  children: React.ReactNode;
  displayedWallets: WalletAdapterManifest[];
  onConnect: (result: WalletConnectionResult) => void;
  navigateTo: (pageId: PageIdType) => void;
  setSelectedWallet: (wallet: WalletAdapterManifest | null) => void;
}

interface EmailAuthContextValue {
  error: string;
  emailAuthState: EmailAuthState;
  clearError: () => void;
  sendEmailOTP: (email: string) => Promise<void>;
  resetEmailAuth: () => void;
  verifyEmailOTPAndConnect: (otp: string) => Promise<void>;
}

const EmailAuthContext = createContext<EmailAuthContextValue | null>(null);

export const useEmailAuth = () => {
  const context = useContext(EmailAuthContext);
  if (!context) {
    throw new Error('useEmailAuth must be used within an EmailAuthProvider');
  }
  return context;
};

export const EmailAuthProvider = ({
  children,
  displayedWallets,
  onConnect,
  navigateTo,
  setSelectedWallet,
}: EmailAuthProviderProps) => {
  const initialAuthState: EmailAuthState = {
    email: '',
    authResult: null,
    step: 'email',
  };

  const [error, setError] = useState<string>('');
  const [emailAuthState, setEmailAuthState] = useState<EmailAuthState>(initialAuthState);

  const resetEmailAuth = () => {
    setEmailAuthState(initialAuthState);
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  const attemptEmailAuth = async (email: string, emailAdapter: WalletAdapter) => {
    setError('');
    if (!emailAdapter.emailAuthStart) {
      sentryLogger.error('emailAuthStart not implemented');
      throw new Error('emailAuthStart not implemented');
    }
    const authResult = await emailAdapter.emailAuthStart(email);
    setEmailAuthState((prev) => ({ ...prev, authResult, step: 'otp' }));
    navigateTo(PAGE_IDS.EMAIL_VERIFY_OTP);
  };

  const handleAlreadyAuthenticatedError = async (email: string, emailAdapter: WalletAdapter) => {
    try {
      await emailAdapter.disconnect();
      await attemptEmailAuth(email, emailAdapter);
    } catch (retryError) {
      sentryLogger.error('Failed to retry email OTP after disconnect:', { error: retryError });
      setError('Failed to send email verification');
      setEmailAuthState((prev) => ({ ...prev, step: 'email' }));
    }
  };

  const sendEmailOTP = async (email: string) => {
    const emailManifest = displayedWallets.find((m) => m.id === 'email');
    if (!emailManifest) {
      sentryLogger.error('sendEmailOTP: Email adapter not found');
      throw new Error('Email adapter not found');
    }

    setEmailAuthState((prev) => ({ ...prev, email }));

    let emailAdapter: WalletAdapter;
    try {
      emailAdapter = await loadAdapter(emailManifest);
    } catch (error) {
      sentryLogger.error('sendEmailOTP: failed to load email adapter', { error });
      setError('Failed to send email verification');
      return;
    }

    try {
      await attemptEmailAuth(email, emailAdapter);
    } catch (error) {
      setEmailAuthState((prev) => ({ ...prev, step: 'email' }));

      const errorMessage = (error as Error).message?.toLowerCase() ?? '';
      const isAlreadyAuthenticated = errorMessage.includes('user is already authenticated');

      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
      } else if (isAlreadyAuthenticated) {
        try {
          await handleAlreadyAuthenticatedError(email, emailAdapter);
        } catch {
          setError('Failed to send email verification');
        }
      } else {
        setError('Failed to send email verification');
      }
    }
  };

  const verifyEmailOTPAndConnect = async (otp: string) => {
    try {
      if (!emailAuthState.authResult) {
        sentryLogger.error('No auth result found');
        throw new Error('No auth result found');
      }

      const emailManifest = displayedWallets.find((m) => m.id === 'email');
      if (!emailManifest) {
        sentryLogger.error('verifyEmailOTPAndConnect: Email adapter not found');
        throw new Error('Email adapter not found');
      }

      setEmailAuthState((prev) => ({ ...prev, step: 'connecting' }));

      // Cache hit — sendEmailOTP already loaded this adapter.
      const emailAdapter = await loadAdapter(emailManifest);

      if (!emailAdapter.emailAuthVerify) {
        sentryLogger.error('emailAuthVerify not implemented');
        throw new Error('emailAuthVerify not implemented');
      }
      const verifyResult = await emailAdapter.emailAuthVerify(emailAuthState.authResult.flowId, otp);
      setSelectedWallet(emailManifest);

      setEmailAuthState((prev) => ({ ...prev, step: 'success' }));

      setTimeout(() => {
        onConnect({
          walletId: emailAdapter.id,
          address: verifyResult.user?.evmAccounts?.[0] ?? '',
          provider: emailAdapter.getProvider() as AurumRpcProvider,
          email: emailAuthState.email,
        });
      }, 1500);
    } catch {
      setError('Invalid or expired code');
      setEmailAuthState((prev) => ({ ...prev, step: 'otp' }));
    }
  };

  const contextValue: EmailAuthContextValue = {
    error,
    emailAuthState,
    clearError,
    sendEmailOTP,
    resetEmailAuth,
    verifyEmailOTPAndConnect,
  };

  return <EmailAuthContext.Provider value={contextValue}>{children}</EmailAuthContext.Provider>;
};
