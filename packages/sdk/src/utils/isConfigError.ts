/**
 * Checks if an error is a configuration error (missing project ID).
 * Used to detect when adapters fail due to missing required configuration.
 */
export const isConfigError = (error: unknown): boolean => {
  const name = (error as Error)?.name;
  return name === 'ConfigError';
};

/**
 * Creates a standardized configuration error for missing project IDs.
 * All adapters should use this to ensure consistent error handling.
 */
export const createConfigError = (adapterName: string): Error => {
  const error = new Error(`Missing required project ID for ${adapterName}`);
  error.name = 'ConfigError';
  return error;
};
