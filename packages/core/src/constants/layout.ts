import React from 'react';

/**
 * Shared layout constants for page containers (Modal and Widget).
 * These values ensure parity between modal and embedded widget views.
 */

/** Padding around the page content container (rem) */
export const PAGE_CONTENT_PADDING = 0.25;

/** Minimum height of the page content area */
export const PAGE_MIN_HEIGHT = '8rem';

/** Maximum height of the page content area */
export const PAGE_MAX_HEIGHT = '600'; // px

/** Padding at top of content to reserve space for the fixed header */
export const HEADER_HEIGHT = '3.5rem';

/** Spacer height above the PoweredBy footer (rem) */
export const POWERED_BY_SPACER_REM = 2.5;

/** Debounce delay for resize events (ms) */
export const RESIZE_DEBOUNCE_MS = 100;

/**
 * Static style for the content wrapper inside page transitions.
 * Provides space for the absolutely-positioned header.
 */
export const contentWrapperStyle: React.CSSProperties = { paddingTop: HEADER_HEIGHT };
