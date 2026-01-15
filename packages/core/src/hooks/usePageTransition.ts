import { useEffect, useRef, useState, useLayoutEffect, useMemo, RefObject } from 'react';
import { ANIMATION_DURATION } from '@src/constants/theme';
import { PAGE_CONTENT_PADDING, PAGE_MIN_HEIGHT, PAGE_MAX_HEIGHT } from '@src/constants/layout';

// Hook to measure and track content height for smooth animations.
export function useContentHeight(
  contentRef: RefObject<HTMLDivElement | null>,
  transitionKey: string | number,
): number | null {
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  // Measure content height before paint
  useLayoutEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [transitionKey]);

  // Watch for dynamic content changes
  useEffect(() => {
    if (!contentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContentHeight(entry.target.scrollHeight);
      }
    });

    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [transitionKey]);

  return contentHeight;
}

// Hook for page transition animation (fade in/out on page change).
export function usePageActiveState(transitionKey: string | number): boolean {
  const prevKeyRef = useRef(transitionKey);
  const [isPageActive, setIsPageActive] = useState(true);

  useEffect(() => {
    if (prevKeyRef.current === transitionKey) return;
    prevKeyRef.current = transitionKey;

    setIsPageActive(false);
    // Double rAF ensures DOM updates before triggering fade-in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsPageActive(true));
    });
  }, [transitionKey]);

  return isPageActive;
}

// Handles smooth height animations when content changes.
export function usePageContainerStyle(contentHeight: number | null): React.CSSProperties {
  return useMemo<React.CSSProperties>(
    () => ({
      height: contentHeight ? `${contentHeight / 16 + PAGE_CONTENT_PADDING * 2}rem` : 'auto',
      minHeight: PAGE_MIN_HEIGHT,
      maxHeight: PAGE_MAX_HEIGHT,
      padding: `${PAGE_CONTENT_PADDING}rem`,
      margin: `${-PAGE_CONTENT_PADDING}rem`,
      width: `calc(100% + ${PAGE_CONTENT_PADDING * 2}rem)`,
      boxSizing: 'border-box',
      transition: contentHeight
        ? `height ${ANIMATION_DURATION.MODAL_HEIGHT_TRANSITION}ms cubic-bezier(0.4, 0, 0.2, 1)`
        : 'none',
    }),
    [contentHeight],
  );
}
