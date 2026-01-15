import React, { useRef } from 'react';
import { useContentHeight, usePageActiveState, usePageContainerStyle } from '@src/hooks/usePageTransition';
import { contentWrapperStyle } from '@src/constants/layout';

interface PageTransitionContainerProps {
  /** Key that triggers page transition animation when changed */
  transitionKey: string | number;
  /** Page content to render */
  children: React.ReactNode;
}

/**
 * Shared page transition container used by both Modal and Widget.
 *
 * Provides:
 * - Smooth height animations when content changes
 * - Fade in/out transitions when transitionKey changes
 * - Consistent padding/spacing for header overlay
 *
 * ## Structure
 * ```
 * .modal-page-container (height animation, overflow handling)
 *   └── .modal-page (opacity transition)
 *       └── content wrapper (paddingTop for header space)
 *           └── {children}
 * ```
 *
 * @see Modal - Uses this with transitionKey from navigation
 * @see ConnectWidget - Uses this with currentPage from NavigationContext
 */
export const PageTransitionContainer: React.FC<PageTransitionContainerProps> = ({ transitionKey, children }) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const contentHeight = useContentHeight(contentRef, transitionKey);
  const isPageActive = usePageActiveState(transitionKey);
  const containerStyle = usePageContainerStyle(contentHeight);

  return (
    <div className="modal-page-container" style={containerStyle}>
      <div key={transitionKey} ref={pageRef} className={`modal-page ${isPageActive ? 'active' : ''}`}>
        <div ref={contentRef} style={contentWrapperStyle}>
          {children}
        </div>
      </div>
    </div>
  );
};
