export function normalizeChainId(chainId: `0x${string}` | string | number): string {
  if (typeof chainId === 'string' && chainId.startsWith('0x')) return chainId;
  const numericId = typeof chainId === 'number' ? chainId : Number(chainId);
  if (Number.isNaN(numericId)) {
    throw new Error(`Invalid chainId: ${chainId}`);
  }
  return `0x${numericId.toString(16)}`;
}

export function isChainNotAddedError(error: { code?: number; message?: string }): boolean {
  return Boolean(
    error?.code === 4902 ||
      error?.message?.includes('Unrecognized chain ID') ||
      error?.message?.includes('Chain ID not supported'),
  );
}

export function isChainExistsError(error: { code?: number; message?: string }): boolean {
  return Boolean(
    error?.code === 4001 || // User rejected
      error?.code === -32000 || // Chain already pending/exists
      error?.message?.includes('already exists') ||
      error?.message?.includes('already pending'),
  );
}
