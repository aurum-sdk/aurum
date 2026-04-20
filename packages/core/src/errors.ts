/**
 * Typed error hierarchy for @aurum-sdk/core.
 *
 * Consumers can discriminate failures via `instanceof UserRejectedError` or
 * `err.code === 'USER_REJECTED'` instead of sniffing error message strings.
 *
 * All errors thrown from the public AurumCore API extend AurumError.
 */

export abstract class AurumError extends Error {
  abstract readonly code: string;
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    // Preserve prototype for `instanceof` across transpilation targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UserRejectedError extends AurumError {
  readonly code = 'USER_REJECTED';
}

export class ChainSwitchRejectedError extends AurumError {
  readonly code = 'CHAIN_SWITCH_REJECTED';
}

export class WalletNotInstalledError extends AurumError {
  readonly code = 'WALLET_NOT_INSTALLED';
  constructor(
    public readonly walletId: string,
    cause?: unknown,
  ) {
    super(`${walletId} is not installed`, cause);
  }
}

export class WalletNotConfiguredError extends AurumError {
  readonly code = 'WALLET_NOT_CONFIGURED';
  constructor(
    public readonly walletId: string,
    cause?: unknown,
  ) {
    super(`${walletId} is not configured`, cause);
  }
}

export class WalletExcludedError extends AurumError {
  readonly code = 'WALLET_EXCLUDED';
  constructor(
    public readonly walletId: string,
    cause?: unknown,
  ) {
    super(`${walletId} is excluded from wallet options`, cause);
  }
}

export class ChainNotSupportedError extends AurumError {
  readonly code = 'CHAIN_NOT_SUPPORTED';
}

export class InvalidConfigError extends AurumError {
  readonly code = 'INVALID_CONFIG';
}

export class ConnectionError extends AurumError {
  readonly code = 'CONNECTION_FAILED';
}

interface NormalizeContext {
  operation?: 'connect' | 'switchChain' | string;
}

const USER_REJECTION_REGEX = /user (rejected|denied|cancel(l?)ed)/i;

/**
 * Normalize an unknown thrown value into an AurumError.
 *
 * Used at public-method boundaries so errors from wallet adapters (which vary in shape)
 * exit the core with a stable, typed surface. Centralized message-regex fallback means
 * downstream consumers don't need to re-implement the heuristic.
 */
export function normalizeError(err: unknown, context?: NormalizeContext): AurumError {
  if (err instanceof AurumError) return err;

  const rawCode = (err as { code?: unknown } | null)?.code;
  const rawMessage = (err as { message?: unknown } | null)?.message;
  const message = typeof rawMessage === 'string' ? rawMessage : 'Unknown error';

  const isRejectionCode = rawCode === 4001 || rawCode === '4001' || rawCode === 'ACTION_REJECTED';
  const isRejectionMessage = typeof rawMessage === 'string' && USER_REJECTION_REGEX.test(rawMessage);

  if (isRejectionCode || isRejectionMessage) {
    return context?.operation === 'switchChain'
      ? new ChainSwitchRejectedError(message, err)
      : new UserRejectedError(message, err);
  }

  return new ConnectionError(message, err);
}
