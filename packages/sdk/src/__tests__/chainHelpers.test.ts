import { describe, it, expect } from 'vitest';
import { normalizeChainId, isChainNotAddedError, isChainExistsError } from '@src/utils/chainHelpers';

describe('normalizeChainId', () => {
  it('returns hex string unchanged', () => {
    expect(normalizeChainId('0x1')).toBe('0x1');
    expect(normalizeChainId('0x89')).toBe('0x89');
    expect(normalizeChainId('0xa4b1')).toBe('0xa4b1');
  });

  it('converts number to hex string', () => {
    expect(normalizeChainId(1)).toBe('0x1');
    expect(normalizeChainId(137)).toBe('0x89');
    expect(normalizeChainId(42161)).toBe('0xa4b1');
  });

  it('converts numeric string to hex string', () => {
    expect(normalizeChainId('1')).toBe('0x1');
    expect(normalizeChainId('137')).toBe('0x89');
    expect(normalizeChainId('42161')).toBe('0xa4b1');
  });
});

describe('isChainNotAddedError', () => {
  it('returns true for error code 4902', () => {
    expect(isChainNotAddedError({ code: 4902 })).toBe(true);
  });

  it('returns true for "Unrecognized chain ID" message', () => {
    expect(isChainNotAddedError({ message: 'Unrecognized chain ID' })).toBe(true);
    expect(isChainNotAddedError({ message: 'Error: Unrecognized chain ID 0x123' })).toBe(true);
  });

  it('returns true for "Chain ID not supported" message', () => {
    expect(isChainNotAddedError({ message: 'Chain ID not supported' })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isChainNotAddedError({ code: 4001 })).toBe(false);
    expect(isChainNotAddedError({ message: 'User rejected' })).toBe(false);
    expect(isChainNotAddedError({})).toBe(false);
  });
});

describe('isChainExistsError', () => {
  it('returns true for user rejection (code 4001)', () => {
    expect(isChainExistsError({ code: 4001 })).toBe(true);
  });

  it('returns true for chain pending/exists (code -32000)', () => {
    expect(isChainExistsError({ code: -32000 })).toBe(true);
  });

  it('returns true for "already exists" message', () => {
    expect(isChainExistsError({ message: 'Chain already exists' })).toBe(true);
  });

  it('returns true for "already pending" message', () => {
    expect(isChainExistsError({ message: 'Request already pending' })).toBe(true);
  });

  it('returns false for other errors', () => {
    expect(isChainExistsError({ code: 4902 })).toBe(false);
    expect(isChainExistsError({ message: 'Unknown error' })).toBe(false);
    expect(isChainExistsError({})).toBe(false);
  });
});
