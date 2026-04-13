import React, {
  useState,
  useEffect,
  useRef,
  RefObject,
  forwardRef,
  useImperativeHandle,
} from "react";
import { createPortal } from "react-dom";
import { IVisibilityToggleHelperProps, IVisibilityToggleHelperRef } from "./types";
import { Content } from "./styles";
import { usePopupPosition } from "./usePopupPosition";
import { supportsPopover } from "./utils";

// TODO: Improvement: handle focus trap inside pop up
const VisibilityToggleHelper = forwardRef<IVisibilityToggleHelperRef, IVisibilityToggleHelperProps>(
  (
    {
      children,
      renderTarget,
      action = "hover",
      position = "right-center",
      offset = { x: 0, y: 0 },
      initialIsVisible = false,
      closeOnClickOutside = true,
      isChildInteractive = false,
      childInteractiveTimeout = 300,
      id,
      testId,
      onVisibilityChange,
      popoverStyles,
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(initialIsVisible);
    const [isPopoverPropertySet, setIsPopoverProperty] = useState(false);

    const targetRef = useRef<HTMLElement | null>(null);
    const popupRef = useRef<HTMLElement | null>(null);

    const isClickAction = action === "click";
    const isHoverAction = action === "hover";

    const isChildHovered = useRef(false);
    const setIsChildHovered = (value: boolean) => {
      isChildHovered.current = value;
    };
    const isParentHovered = useRef(false);
    const setIsParentHovered = (value: boolean) => {
      isParentHovered.current = value;
    };
    const tooltipHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Tracks recent click inside popup to suppress mouseleave during  content re-renders
    const popupClickedRef = useRef(false);

    const handleToggle = (value: boolean) => {
      setIsVisible((prevIsVisible) => {
        const newIsVisible = value ?? !prevIsVisible;
        if (prevIsVisible !== newIsVisible) {
          onVisibilityChange?.(newIsVisible);
        }
        if (supportsPopover()) {
          if (newIsVisible === false && popupRef.current?.matches(":popover-open")) {
            popupRef.current?.hidePopover();
          }
          if (newIsVisible === true && !popupRef.current?.matches(":popover-open")) {
            popupRef.current?.showPopover();
          }
        }

        return newIsVisible;
      });
    };

    // Exposing methods to parent
    useImperativeHandle(
      ref,
      () => ({
        close: () => {
          handleToggle(false);
        },
        open: () => {
          handleToggle(true);
        },
      }),
      [],
    );

    const focusOnPopup = () => {
      setTimeout(() => {
        if (popupRef.current) {
          popupRef.current.focus();
        }
      }, 0);
    };

    // Handling outside clicks to close the popover
    useEffect(() => {
      const handleOutsideClick = (event: MouseEvent) => {
        if (
          popupRef.current &&
          !popupRef.current.contains(event.target as HTMLElement) &&
          targetRef.current &&
          !targetRef.current.contains(event.target as HTMLElement)
        ) {
          handleToggle(false);
        }
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape" && isVisible) {
          handleToggle(false);
        }
      };

      if (closeOnClickOutside) {
        document.addEventListener("click", handleOutsideClick);
        document.addEventListener("keydown", handleKeyDown);
      }

      return () => {
        if (closeOnClickOutside) {
          document.removeEventListener("click", handleOutsideClick);
          document.removeEventListener("keydown", handleKeyDown);
        }
      };
    }, [action, closeOnClickOutside, isVisible, targetRef, popupRef]);

    // Handling mouse interaction with target and popover elements
    useEffect(() => {
      const handleTargetClick = () => {
        // handle target click event
        handleToggle(true);
      };

      const handleTargetMouseEnter = () => {
        // handle target mouse enter event
        setIsParentHovered(true);
        handleToggle(true);
      };

      const handleTargetMouseLeave = () => {
        setIsParentHovered(false);
        // handle target mouse leave event
        if (isChildInteractive) {
          // Incase the child is interactive, we need to prevent the Popover from closing instantly when mouse leaves the target
          if (tooltipHideTimeoutRef.current) {
            clearTimeout(tooltipHideTimeoutRef.current);
          }
          tooltipHideTimeoutRef.current = setTimeout(() => {
            if (!isChildHovered.current && !isParentHovered.current) {
              handleToggle(false);
            }
          }, childInteractiveTimeout);
        } else {
          handleToggle(false);
        }
      };

      const handlePopupMouseEnter = () => {
        setIsChildHovered(true);
        if (tooltipHideTimeoutRef.current) {
          clearTimeout(tooltipHideTimeoutRef.current);
        }
      };

      const handlePopupMouseLeave = () => {
        if (popupClickedRef.current) {
          return;
        }
        setIsChildHovered(false);
        if (tooltipHideTimeoutRef.current) {
          clearTimeout(tooltipHideTimeoutRef.current);
        }
        tooltipHideTimeoutRef.current = setTimeout(() => {
          if (!isChildHovered.current && !isParentHovered.current) {
            handleToggle(false);
          }
        }, childInteractiveTimeout);
      };

      const handlePopupBlur = (e: FocusEvent) => {
        const containsRelTarget = popupRef.current?.contains(e.relatedTarget as Node);
        if (containsRelTarget || isChildHovered.current || popupClickedRef.current) {
          return;
        }
        handlePopupMouseLeave();
      };

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter") {
          handleToggle(true);
        }
        if (event.key === "Tab") {
          focusOnPopup();
        }
      };

      if (isClickAction) {
        targetRef.current?.addEventListener("click", handleTargetClick);
        targetRef.current?.addEventListener("keydown", handleKeyDown);
      } else {
        targetRef.current?.addEventListener("mouseenter", handleTargetMouseEnter);
        targetRef.current?.addEventListener("focus", handleTargetMouseEnter);
        targetRef.current?.addEventListener("mouseleave", handleTargetMouseLeave);
        targetRef.current?.addEventListener("blur", handleTargetMouseLeave);
        if (isChildInteractive) {
          popupRef.current?.addEventListener("mouseenter", handlePopupMouseEnter);
          popupRef.current?.addEventListener("focus", handlePopupMouseEnter);
          popupRef.current?.addEventListener("mouseleave", handlePopupMouseLeave);
          popupRef.current?.addEventListener("blur", handlePopupBlur);
        }
      }

      return () => {
        if (isClickAction) {
          targetRef.current?.removeEventListener("click", handleTargetClick);
          targetRef.current?.removeEventListener("keydown", handleKeyDown);
        } else {
          targetRef.current?.removeEventListener("mouseenter", handleTargetMouseEnter);
          targetRef.current?.removeEventListener("focus", handleTargetMouseEnter);
          targetRef.current?.removeEventListener("mouseleave", handleTargetMouseLeave);
          targetRef.current?.removeEventListener("blur", handleTargetMouseLeave);
          if (isChildInteractive) {
            popupRef.current?.removeEventListener("mouseenter", handlePopupMouseEnter);
            popupRef.current?.removeEventListener("focus", handlePopupMouseEnter);
            popupRef.current?.removeEventListener("mouseleave", handlePopupMouseLeave);
            popupRef.current?.removeEventListener("blur", handlePopupBlur);
          }
        }
      };
    }, [action, closeOnClickOutside, isChildInteractive, targetRef, popupRef]);

    useEffect(() => {
      // This will be removed when we adopt to React19
      // Issue => https://github.com/facebook/react/issues/27479
      // Fix => https://github.com/facebook/react/pull/27981
      // Because of this issue we should not mount any content inside the popover div till the property is set by this hook.
      if (popupRef.current && targetRef.current && supportsPopover()) {
        popupRef.current.setAttribute("popover", closeOnClickOutside ? "auto" : "manual");
        setIsPopoverProperty(true);
      }
    }, [popupRef, targetRef, closeOnClickOutside]);

    usePopupPosition({
      isVisible,
      position,
      targetRef,
      popupRef,
      offset,
    });

    const contentId = `content-${id}`;
    const triggerId = `trigger-${id}`;

    const handleContentClickCapture = () => {
      popupClickedRef.current = true;
      setTimeout(() => {
        popupClickedRef.current = false;
      }, childInteractiveTimeout);
    };

    const renderPopover = () => {
      // Using Popover API
      if (supportsPopover()) {
        return (
          <Content
            ref={popupRef as RefObject<HTMLDivElement>}
            id={contentId}
            // popover="auto" // Will be fixed in React 19. Till then we are forced to overwrite these bahaviours through JS. Issue => https://github.com/facebook/react/issues/27479
            // Fix => https://github.com/facebook/react/pull/27981
            data-testid={`content-${testId || id}`}
            role={isClickAction ? "dialog" : "tooltip"}
            tabIndex={isChildInteractive || isClickAction ? 0 : -1} // TabIndex set to 0, so that the in case child is interactive, the popover should be the next element in the tab order. In case its not interactive, the popover should not be in the tab order.
            onClickCapture={handleContentClickCapture}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            style={isPopoverPropertySet ? popoverStyles : { display: "none" }}
          >
            {isPopoverPropertySet ? children : null}
          </Content>
        );
      }

      // For Older browsers not having support for Popover API
      return createPortal(
        <Content
          ref={popupRef as RefObject<HTMLDivElement>}
          id={contentId}
          data-testid={`content-${testId || id}`}
          hidden={!isVisible}
          role={isClickAction ? "dialog" : "tooltip"}
          tabIndex={isChildInteractive || isClickAction ? 0 : -1} // TabIndex set to 0, so that the in case child is interactive, the popover should be the next element in the tab order. In case its not interactive, the popover should not be in the tab order.
          onClickCapture={handleContentClickCapture}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          style={popoverStyles}
        >
          {children}
        </Content>,
        document.body,
        id,
      );
    };

    return (
      <>
        {renderTarget({
          ref: targetRef,
          id: triggerId,
          "data-testid": `trigger-${testId || id}`,
          "aria-controls": contentId,
          "aria-selected": isClickAction ? isVisible : undefined,
          "aria-expanded": isClickAction ? isVisible : undefined,
          "aria-describedby": isHoverAction ? contentId : undefined,
          tabIndex: 0, // Making the element focusable
        })}
        {renderPopover()}
      </>
    );
  },
);

export default VisibilityToggleHelper;
