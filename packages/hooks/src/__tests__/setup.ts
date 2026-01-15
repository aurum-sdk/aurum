import { vi } from 'vitest';

// Suppress React act() warnings from async provider initialization
// These are expected when testing hooks that use async useEffect
/* eslint-disable no-console */
const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('not wrapped in act')) {
    return;
  }
  originalError.call(console, ...args);
};
/* eslint-enable no-console */

// Mock Aurum SDK
export const mockAurum = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  getUserInfo: vi.fn(),
  isConnected: vi.fn(),
  getChainId: vi.fn(),
  switchChain: vi.fn(),
  whenReady: vi.fn().mockResolvedValue(undefined),
  rpcProvider: {
    on: vi.fn(),
    removeListener: vi.fn(),
  },
};

export function createMockAurum(overrides: Record<string, unknown> = {}) {
  return {
    ...mockAurum,
    ...overrides,
    rpcProvider: {
      ...mockAurum.rpcProvider,
      ...((overrides.rpcProvider as Record<string, unknown>) || {}),
    },
  };
}

export function resetMocks() {
  Object.values(mockAurum).forEach((mock) => {
    if (typeof mock === 'function' && 'mockReset' in mock) {
      mock.mockReset();
    }
  });
  mockAurum.whenReady.mockResolvedValue(undefined);
}
