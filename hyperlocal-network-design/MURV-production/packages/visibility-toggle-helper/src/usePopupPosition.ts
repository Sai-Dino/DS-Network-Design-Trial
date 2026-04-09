import React, { useEffect, useLayoutEffect, useCallback } from "react";
import throttle from "lodash.throttle";
import { IVisibilityToggleHelperProps } from "./types";
import {
  calculatePopupOffset,
  calculatePopupPosition,
  calculatePopupPositionRelativeToTarget,
  findNearestScrollableAncestor,
} from "./utils";

/**
 * Observes resize events on the window
 * @param onResize - callback to be called when the window is resizeds
 */
function useResize(onResize: () => void) {
  useLayoutEffect(() => {
    // Considering the fact that the resize event can be triggered at a high rate, the event handler shouldn't execute computationally expensive operations such as DOM manipulations.
    const throttledResize = throttle(onResize, 100, { leading: false, trailing: true });
    window.addEventListener("resize", throttledResize, false);
    return () => {
      window.removeEventListener("resize", throttledResize, false);
    };
  }, [onResize]);
}

/**
 * Observes if the target element is resized (change in width or height)
 * @param targetRef - ref of the element to observe
 * @param onResize - callback to be called when the element is resized
 */
function useElementResizeObserver({
  targetRef,
  onResize,
}: {
  targetRef: React.RefObject<Element>;
  onResize: () => void;
}) {
  useLayoutEffect(() => {
    if (targetRef.current && window.ResizeObserver) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0].target === targetRef.current) {
          onResize();
        }
      });
      resizeObserver.observe(targetRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
    return () => {};
  }, [targetRef, onResize]);
}

function useParentScroll({
  targetRef,
  onScroll,
}: {
  targetRef: React.RefObject<HTMLElement>;
  onScroll: () => void;
}) {
  useLayoutEffect(() => {
    if (targetRef.current) {
      const scrollableParent = findNearestScrollableAncestor(targetRef.current);
      if (scrollableParent) {
        const throttledScroll = () => requestAnimationFrame(onScroll);
        scrollableParent?.addEventListener("scroll", throttledScroll, false);
        return () => {
          scrollableParent?.removeEventListener("scroll", throttledScroll, false);
        };
      }
    }
    return () => {};
  }, [onScroll]);
}

export interface IPopupPosition {
  targetRef: React.RefObject<HTMLElement>;
  popupRef: React.RefObject<HTMLElement>;
  position: IVisibilityToggleHelperProps["position"];
  offset: IVisibilityToggleHelperProps["offset"];
  isVisible: boolean;
}

export function usePopupPosition({
  targetRef,
  popupRef,
  position,
  offset,
  isVisible,
}: IPopupPosition) {
  const positionPopup = useCallback(() => {
    if (popupRef.current && isVisible && targetRef.current) {
      const popupRelativePosition = calculatePopupPositionRelativeToTarget({
        targetRef,
        popupRef,
        position,
        offset,
      });
      const popupOffset = calculatePopupOffset(targetRef);
      const newPosition = calculatePopupPosition(popupOffset, popupRelativePosition);
      // Clamp to viewport so the popup never overflows the viewport area
      const popupRect = popupRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const viewportW = window.innerWidth;
      const edge = 8;

      const bottomOverflow = newPosition.top - window.scrollY + popupRect.height - viewportH;
      if (bottomOverflow > 0) {
        newPosition.top -= bottomOverflow + edge;
      }

      const topOverflow = -(newPosition.top - window.scrollY);
      if (topOverflow > 0) {
        newPosition.top += topOverflow + edge;
      }

      const rightOverflow = newPosition.left - window.scrollX + popupRect.width - viewportW;
      if (rightOverflow > 0) {
        newPosition.left -= rightOverflow + edge;
      }

      const leftOverflow = -(newPosition.left - window.scrollX);
      if (leftOverflow > 0) {
        newPosition.left += leftOverflow + edge;
      }
      // eslint-disable-next-line no-param-reassign
      popupRef.current.style.top = `${newPosition.top}px`;
      // eslint-disable-next-line no-param-reassign
      popupRef.current.style.left = `${newPosition.left}px`;
    }
  }, [targetRef, popupRef, position, offset, isVisible]);

  useEffect(() => {
    if (isVisible) {
      positionPopup();
    }
  }, [targetRef, popupRef, position, offset, isVisible]);

  useResize(positionPopup);
  useElementResizeObserver({ targetRef, onResize: positionPopup });
  useElementResizeObserver({ targetRef: popupRef, onResize: positionPopup });
  useParentScroll({ targetRef, onScroll: positionPopup });
}
