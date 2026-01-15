import * as Sentry from '@sentry/browser';

declare const __SDK_VERSION__: string;
declare const __SENTRY_DSN__: string;

let initialized = false;
let telemetryEnabled = true;

function getEnvironment(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
  }
  return 'production';
}

export function initSentry(enabled: boolean = true) {
  telemetryEnabled = enabled;
  if (initialized || !telemetryEnabled || !__SENTRY_DSN__) return;
  initialized = true;

  Sentry.init({
    dsn: __SENTRY_DSN__,
    environment: getEnvironment(),
    release: `@aurum/sdk@${__SDK_VERSION__}`,
    sendDefaultPii: false,
    enableLogs: true,
  });
}

// Wrapper that no-ops when telemetry is disabled
export const sentryLogger = {
  info: (message: string, attributes?: Record<string, unknown>) => {
    if (telemetryEnabled) Sentry.logger.info(message, attributes);
  },
  warn: (message: string, attributes?: Record<string, unknown>) => {
    if (telemetryEnabled) Sentry.logger.warn(message, attributes);
  },
  error: (message: string, attributes?: Record<string, unknown>) => {
    if (telemetryEnabled) Sentry.logger.error(message, attributes);
  },
};
