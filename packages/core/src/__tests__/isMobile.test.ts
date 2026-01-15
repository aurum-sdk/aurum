import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isMobile } from '@src/utils/platform/isMobile';

describe('isMobile', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    Object.defineProperty(global, 'window', { value: originalWindow, writable: true });
  });

  const mockWindow = (userAgent: string) => {
    Object.defineProperty(global, 'window', {
      value: {
        navigator: { userAgent },
        screen: { width: 1920, height: 1080 },
      },
      writable: true,
    });
    Object.defineProperty(global, 'navigator', {
      value: { userAgent },
      writable: true,
    });
  };

  it('returns false for desktop user agent', () => {
    mockWindow(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    );
    expect(isMobile()).toBe(false);
  });

  it('returns true for iPhone user agent', () => {
    mockWindow(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    );
    expect(isMobile()).toBe(true);
  });

  it('returns true for Android user agent', () => {
    mockWindow(
      'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    );
    expect(isMobile()).toBe(true);
  });

  it('returns true for iPad user agent', () => {
    mockWindow(
      'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    );
    expect(isMobile()).toBe(true);
  });
});
