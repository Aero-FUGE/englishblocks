import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

let openCount = 0;
let restoreScroll: (() => void) | undefined;

/** Shared by dialogs and the separately portaled music panel. Nested dialogs
 * keep the background locked until the last overlay has closed. */
export function useModalScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return;
    if (openCount++ === 0) {
      const root = document.documentElement;
      const body = document.body;
      const rootOverflow = root.style.overflow;
      const bodyOverflow = body.style.overflow;
      const padding = body.style.paddingRight;
      const scrollbar = Math.max(0, window.innerWidth - root.clientWidth);
      if (scrollbar) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
      root.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      restoreScroll = () => {
        root.style.overflow = rootOverflow;
        body.style.overflow = bodyOverflow;
        body.style.paddingRight = padding;
      };
    }
    return () => {
      if (--openCount === 0) { restoreScroll?.(); restoreScroll = undefined; }
    };
  }, [open]);
}

export function ModalOverlay({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  useModalScrollLock(true);
  return createPortal(<div {...props} className={`eb-modal-overlay ${className}`}>{children}</div>, document.body);
}
