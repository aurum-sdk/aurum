import { createRoot, Root } from 'react-dom/client';
import { createShadowRoot } from '@src/utils/createShadowRoot';
import { NonNullableBrandConfig } from '@aurum-sdk/types';

/** Tracks active modal roots by container ID for cleanup */
const activeRoots = new Map<string, Root>();

export interface ModalContainer {
  root: Root;
  cleanup: () => void;
}

/**
 * Creates a Shadow DOM container for modal rendering with automatic cleanup.
 *
 * Handles:
 * - Cleanup of any existing modal with the same ID
 * - Shadow DOM creation for style isolation
 * - React root creation
 * - Tracking for proper cleanup
 */
export function createModalContainer(id: string, brandConfig: NonNullableBrandConfig): ModalContainer {
  // Cleanup any existing modal with this ID
  const existingRoot = activeRoots.get(id);
  if (existingRoot) {
    existingRoot.unmount();
    document.getElementById(id)?.remove();
    activeRoots.delete(id);
  }

  // Create container with Shadow DOM for style isolation
  const container = document.createElement('div');
  container.id = id;
  document.body.appendChild(container);

  const shadowDOMRoot = createShadowRoot(container, brandConfig);
  const root = createRoot(shadowDOMRoot);
  activeRoots.set(id, root);

  const cleanup = () => {
    root.unmount();
    container.remove();
    activeRoots.delete(id);
  };

  return { root, cleanup };
}
