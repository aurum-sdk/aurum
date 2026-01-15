import { useEffect, RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
  /** Re-focus container when this key changes (e.g., page transitions) */
  refocusKey?: string | number;
}

/**
 * Gets the actual focused element, traversing into Shadow DOM if needed.
 * document.activeElement only returns the shadow host, not the element inside.
 */
function getDeepActiveElement(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }
  return active;
}

/**
 * Traps focus within a container element.
 * - Tab/Shift+Tab cycles within the container
 * - Escape triggers onEscape callback
 * - Refocuses container when refocusKey changes
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  { isActive, onEscape, refocusKey }: UseFocusTrapOptions,
) {
  // Refocus container when page changes
  useEffect(() => {
    if (isActive && containerRef.current) {
      const timer = setTimeout(() => {
        containerRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [refocusKey, isActive]);

  // Focus trap and escape handler
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = getDeepActiveElement();

      // Shift+Tab on first element -> go to last
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element -> go to first
      else if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
      // If focus is outside focusable elements (e.g., on container), go to first/last
      else if (!Array.from(focusableElements).includes(activeElement as HTMLElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
}
