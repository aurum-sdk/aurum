import { NonNullableBrandConfig } from '@aurum/types';
import { generateCompleteStyles } from '@src/utils/generateBrandStyles';

/**
 * Creates a Shadow DOM with all SDK styles injected.
 * Used by modals for style isolation from the host page.
 */
export function createShadowRoot(container: HTMLElement, brandConfig: NonNullableBrandConfig): HTMLElement {
  const shadowRoot = container.attachShadow({ mode: 'open' });

  shadowRoot.innerHTML = `
    <style>${generateCompleteStyles(brandConfig)}</style>
    <div class="aurum-modal-root"></div>
  `;

  return shadowRoot.querySelector('.aurum-modal-root') as HTMLElement;
}
