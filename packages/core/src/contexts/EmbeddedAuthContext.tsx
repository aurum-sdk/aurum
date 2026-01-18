import React, { createContext, useContext, useState } from 'react';
import { SignInWithEmailResult, SignInWithSmsResult } from '@coinbase/cdp-core';
import { WalletAdapter, WalletConnectionResult } from '@src/types/internal';
import { PAGE_IDS, PageIdType } from '@src/components/ConnectModal/PageIds';
import { AurumRpcProvider, WalletId } from '@aurum-sdk/types';
import { sentryLogger } from '@src/services/sentry';
import { isConfigError } from '@src/utils/isConfigError';

export type AuthMethod = 'email' | 'sms';

export interface EmbeddedAuthState {
  authMethod: AuthMethod;
  email: string;
  phoneNumber: string;
  authResult: SignInWithEmailResult | SignInWithSmsResult | null;
  step: 'input' | 'otp' | 'connecting' | 'success';
}

interface EmbeddedAuthProviderProps {
  children: React.ReactNode;
  displayedWallets: WalletAdapter[];
  onConnect: (result: WalletConnectionResult) => void;
  navigateTo: (pageId: PageIdType) => void;
  setSelectedWallet: (wallet: WalletAdapter | null) => void;
}

interface EmbeddedAuthContextValue {
  error: string;
  authState: EmbeddedAuthState;
  clearError: () => void;
  setAuthMethod: (method: AuthMethod) => void;
  sendEmailOTP: (email: string) => Promise<void>;
  sendSmsOTP: (phoneNumber: string) => Promise<void>;
  resetAuth: () => void;
  verifyOTPAndConnect: (otp: string) => Promise<void>;
  hasEmailAuth: boolean;
  hasSmsAuth: boolean;
}

const EmbeddedAuthContext = createContext<EmbeddedAuthContextValue | null>(null);

export const useEmbeddedAuth = () => {
  const context = useContext(EmbeddedAuthContext);
  if (!context) {
    throw new Error('useEmbeddedAuth must be used within an EmbeddedAuthProvider');
  }
  return context;
};

export const EmbeddedAuthProvider = ({
  children,
  displayedWallets,
  onConnect,
  navigateTo,
  setSelectedWallet,
}: EmbeddedAuthProviderProps) => {
  const hasEmailAuth = displayedWallets.some((adapter) => adapter.id === WalletId.Email);
  const hasSmsAuth = displayedWallets.some((adapter) => adapter.id === WalletId.Sms);

  // Default to email if available, otherwise SMS
  const defaultAuthMethod: AuthMethod = hasEmailAuth ? 'email' : 'sms';

  const initialAuthState: EmbeddedAuthState = {
    authMethod: defaultAuthMethod,
    email: '',
    phoneNumber: '',
    authResult: null,
    step: 'input',
  };

  const [error, setError] = useState<string>('');
  const [authState, setAuthState] = useState<EmbeddedAuthState>(initialAuthState);

  const resetAuth = () => {
    setAuthState(initialAuthState);
    setError('');
  };

  const clearError = () => {
    setError('');
  };

  const setAuthMethod = (method: AuthMethod) => {
    setAuthState((prev) => ({ ...prev, authMethod: method }));
    setError('');
  };

  /* EMAIL AUTH */

  const attemptEmailAuth = async (email: string, emailAdapter: WalletAdapter) => {
    setError('');
    if (!emailAdapter.emailAuthStart) {
      sentryLogger.error('emailAuthStart not implemented');
      throw new Error('emailAuthStart not implemented');
    }
    const authResult = await emailAdapter.emailAuthStart(email);
    setAuthState((prev) => ({ ...prev, authResult, step: 'otp' }));
    navigateTo(PAGE_IDS.VERIFY_OTP);
  };

  const handleAlreadyAuthenticatedError = async (
    identifier: string,
    adapter: WalletAdapter,
    retryFn: (id: string, adapter: WalletAdapter) => Promise<void>,
    errorMessage: string,
  ) => {
    try {
      await adapter.disconnect();
      await retryFn(identifier, adapter);
    } catch (retryError) {
      sentryLogger.error(`Failed to retry OTP after disconnect:`, { error: retryError });
      setError(errorMessage);
      setAuthState((prev) => ({ ...prev, step: 'input' }));
    }
  };

  const sendEmailOTP = async (email: string) => {
    const emailAdapter = displayedWallets.find((adapter) => adapter.id === WalletId.Email);
    if (!emailAdapter) {
      sentryLogger.error('sendEmailOTP: Email adapter not found');
      throw new Error('Email adapter not found');
    }

    setAuthState((prev) => ({ ...prev, email, authMethod: 'email' }));

    try {
      await attemptEmailAuth(email, emailAdapter);
    } catch (error) {
      setAuthState((prev) => ({ ...prev, step: 'input' }));

      const errorMessage = (error as Error).message?.toLowerCase() ?? '';
      const isAlreadyAuthenticated = errorMessage.includes('user is already authenticated');

      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
      } else if (isAlreadyAuthenticated) {
        try {
          await handleAlreadyAuthenticatedError(
            email,
            emailAdapter,
            attemptEmailAuth,
            'Failed to send email verification',
          );
        } catch {
          setError('Failed to send email verification');
        }
      } else {
        setError('Failed to send email verification');
      }
    }
  };

  /* SMS AUTH */

  const attemptSmsAuth = async (phoneNumber: string, smsAdapter: WalletAdapter) => {
    setError('');
    if (!smsAdapter.smsAuthStart) {
      sentryLogger.error('smsAuthStart not implemented');
      throw new Error('smsAuthStart not implemented');
    }
    const authResult = await smsAdapter.smsAuthStart(phoneNumber);
    setAuthState((prev) => ({ ...prev, authResult, step: 'otp' }));
    navigateTo(PAGE_IDS.VERIFY_OTP);
  };

  const sendSmsOTP = async (phoneNumber: string) => {
    const smsAdapter = displayedWallets.find((adapter) => adapter.id === WalletId.Sms);
    if (!smsAdapter) {
      sentryLogger.error('sendSmsOTP: SMS adapter not found');
      throw new Error('SMS adapter not found');
    }

    setAuthState((prev) => ({ ...prev, phoneNumber, authMethod: 'sms' }));

    try {
      await attemptSmsAuth(phoneNumber, smsAdapter);
    } catch (error) {
      setAuthState((prev) => ({ ...prev, step: 'input' }));

      const errorMessage = (error as Error).message?.toLowerCase() ?? '';
      const isAlreadyAuthenticated = errorMessage.includes('user is already authenticated');

      if (isConfigError(error)) {
        navigateTo(PAGE_IDS.CONFIG_ERROR);
      } else if (isAlreadyAuthenticated) {
        try {
          await handleAlreadyAuthenticatedError(
            phoneNumber,
            smsAdapter,
            attemptSmsAuth,
            'Failed to send SMS verification',
          );
        } catch {
          setError('Failed to send SMS verification');
        }
      } else {
        setError('Failed to send SMS verification');
      }
    }
  };

  /* VERIFY OTP */

  const verifyOTPAndConnect = async (otp: string) => {
    try {
      if (!authState.authResult) {
        sentryLogger.error('No auth result found');
        throw new Error('No auth result found');
      }

      const isEmail = authState.authMethod === 'email';
      const adapterId = isEmail ? WalletId.Email : WalletId.Sms;
      const adapter = displayedWallets.find((a) => a.id === adapterId);

      if (!adapter) {
        sentryLogger.error(`verifyOTPAndConnect: ${authState.authMethod} adapter not found`);
        throw new Error(`${authState.authMethod} adapter not found`);
      }

      setAuthState((prev) => ({ ...prev, step: 'connecting' }));

      let address: string | undefined;

      if (isEmail) {
        if (!adapter.emailAuthVerify) {
          sentryLogger.error('emailAuthVerify not implemented');
          throw new Error('emailAuthVerify not implemented');
        }
        const verifyResult = await adapter.emailAuthVerify(authState.authResult.flowId, otp);
        address = verifyResult.user?.evmAccounts?.[0];
      } else {
        if (!adapter.smsAuthVerify) {
          sentryLogger.error('smsAuthVerify not implemented');
          throw new Error('smsAuthVerify not implemented');
        }
        const verifyResult = await adapter.smsAuthVerify(authState.authResult.flowId, otp);
        address = verifyResult.user?.evmAccounts?.[0];
      }

      setSelectedWallet(adapter);
      setAuthState((prev) => ({ ...prev, step: 'success' }));

      setTimeout(() => {
        onConnect({
          walletId: adapter.id,
          address: address ?? '',
          provider: adapter.getProvider() as AurumRpcProvider,
          email: isEmail ? authState.email : undefined,
          phoneNumber: !isEmail ? authState.phoneNumber : undefined,
        });
      }, 1500);
    } catch {
      setError('Invalid or expired code');
      setAuthState((prev) => ({ ...prev, step: 'otp' }));
    }
  };

  const contextValue: EmbeddedAuthContextValue = {
    error,
    authState,
    clearError,
    setAuthMethod,
    sendEmailOTP,
    sendSmsOTP,
    resetAuth,
    verifyOTPAndConnect,
    hasEmailAuth,
    hasSmsAuth,
  };

  return <EmbeddedAuthContext.Provider value={contextValue}>{children}</EmbeddedAuthContext.Provider>;
};
