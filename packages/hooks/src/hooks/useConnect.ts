'use client';

import { useState, useCallback } from 'react';
import { useAurumContext } from '@src/AurumContext';
import type { WalletId, WalletConnectSessionResult } from '@aurum-sdk/types';

/**
 * Connect to a wallet.
 *
 * @example
 * ```tsx
 * const { connect, emailAuthStart, emailAuthVerify, getWalletConnectSession, isPending, error } = useConnect();
 *
 * // Open wallet selection modal
 * await connect();
 *
 * // Or connect directly to a specific wallet
 * await connect(WalletId.MetaMask);
 *
 * // Or use headless email auth
 * const { flowId } = await emailAuthStart('user@example.com');
 * const { address, email } = await emailAuthVerify(flowId, '123456');
 *
 * // Or use headless WalletConnect
 * const { uri, waitForConnection } = await getWalletConnectSession();
 * // Display your own QR code with `uri`
 * const address = await waitForConnection();
 * ```
 */
export function useConnect() {
  const { aurum } = useAurumContext();

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(
    async (walletId?: WalletId) => {
      setIsPending(true);
      setError(null);

      try {
        const address = await aurum.connect(walletId);
        return address;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('User rejected connection');
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [aurum],
  );

  const emailAuthStart = useCallback(
    async (email: string) => {
      setIsPending(true);
      setError(null);

      try {
        const result = await aurum.emailAuthStart(email);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to start email auth');
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [aurum],
  );

  const emailAuthVerify = useCallback(
    async (flowId: string, otp: string) => {
      setIsPending(true);
      setError(null);

      try {
        const result = await aurum.emailAuthVerify(flowId, otp);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to verify email');
        setError(error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
    [aurum],
  );

  const getWalletConnectSession = useCallback(async (): Promise<WalletConnectSessionResult> => {
    setIsPending(true);
    setError(null);

    try {
      const result = await aurum.getWalletConnectSession();
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get WalletConnect session');
      setError(error);
      throw error;
    } finally {
      setIsPending(false);
    }
  }, [aurum]);

  return {
    connect,
    emailAuthStart,
    emailAuthVerify,
    getWalletConnectSession,
    isPending,
    error,
  };
}
