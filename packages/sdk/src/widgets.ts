/**
 * @aurum/sdk/widgets
 *
 * React widget components for embedded wallet connection UI.
 * Reuses your existing Aurum instance's configuration.
 *
 * @example
 * ```tsx
 * import { Aurum } from '@aurum/sdk';
 * import { ConnectWidget } from '@aurum/sdk/widgets';
 *
 * const aurum = new Aurum({ ... });
 *
 * function App() {
 *   return <ConnectWidget aurum={aurum} onConnect={(result) => console.log(result)} />;
 * }
 * ```
 */
export * from '@src/components/widgets';
