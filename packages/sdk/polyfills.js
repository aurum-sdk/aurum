// Browser polyfills for Node.js globals
import { Buffer } from 'buffer';

// Make Buffer available globally immediately
globalThis.Buffer = globalThis.Buffer || Buffer;

// Also ensure it's available on window for older browsers
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Ensure process.env exists
if (typeof globalThis.process === 'undefined') {
  globalThis.process = { env: {} };
}

// Ensure global exists and points to globalThis
if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

// Polyfill for crypto.randomUUID() - not available in all mobile browsers/WebViews
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
