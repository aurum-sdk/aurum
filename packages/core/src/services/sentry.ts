import { BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope } from '@sentry/browser';

declare const __SDK_VERSION__: string;
declare const __SENTRY_DSN__: string;

let initialized = false;
let telemetryEnabled = true;
// Isolated scope+client — never touches the consumer's global Sentry hub
let aurumScope: Scope | null = null;

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

  const client = new BrowserClient({
    dsn: __SENTRY_DSN__,
    environment: getEnvironment(),
    release: `@aurum-sdk/core@${__SDK_VERSION__}`,
    sendDefaultPii: false,
    transport: makeFetchTransport,
    stackParser: defaultStackParser,
    integrations: getDefaultIntegrations({}),
  });

  aurumScope = new Scope();
  aurumScope.setClient(client);
  client.init();
}

function getUrl(): string | undefined {
  if (typeof window !== 'undefined') {
    return window.location.href;
  }
  return undefined;
}

function capture(message: string, level: 'info' | 'warning' | 'error', attributes?: Record<string, unknown>) {
  if (!telemetryEnabled || !aurumScope) return;
  const scope = aurumScope.clone();
  scope.setContext('attributes', { url: getUrl(), ...attributes });
  scope.captureMessage(message, level);
}

export const sentryLogger = {
  info: (message: string, attributes?: Record<string, unknown>) => capture(message, 'info', attributes),
  warn: (message: string, attributes?: Record<string, unknown>) => capture(message, 'warning', attributes),
  error: (message: string, attributes?: Record<string, unknown>) => capture(message, 'error', attributes),
};
