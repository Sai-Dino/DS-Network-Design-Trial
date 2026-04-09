import { IVisibilityToggleHelperProps } from "./types";

export function calculatePopupPosition(
  popupOffset: { top: number; left: number },
  popupRelativePosition: { top: number; left: number },
) {
  return {
    top: popupOffset.top + popupRelativePosition.top,
    left: popupOffset.left + popupRelativePosition.left,
  };
}

export function calculatePopupOffset(targetRef: React.RefObject<Element>) {
  const targetRect = targetRef?.current?.getBoundingClientRect() || { top: 0, left: 0 };
  return {
    top: window.scrollY + targetRect.top,
    left: window.scrollX + targetRect.left,
  };
}

export function calculatePopupPositionRelativeToTarget({
  targetRef,
  popupRef,
  position = "right-center",
  offset = { x: 0, y: 0 },
}: {
  targetRef: React.RefObject<HTMLElement>;
  popupRef: React.RefObject<HTMLElement>;
  position: IVisibilityToggleHelperProps["position"];
  offset: IVisibilityToggleHelperProps["offset"];
}) {
  const popUpStyles = {
    top: 0,
    left: 0,
  };
  if (targetRef.current && popupRef.current) {
    const targetRect = targetRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();

    switch (position) {
      case "right-center":
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = targetRect.height / 2 - popupRect.height / 2 + offset.y;
        break;

      case "left-center":
        popUpStyles.left = -(offset.x + popupRect.width);
        popUpStyles.top = targetRect.height / 2 - popupRect.height / 2 + offset.y;
        break;

      case "top-center":
        popUpStyles.left = targetRect.width / 2 - popupRect.width / 2 + offset.x;
        popUpStyles.top = -(popupRect.height + offset.y);
        break;

      case "bottom-center":
        popUpStyles.left = targetRect.width / 2 - popupRect.width / 2 + offset.x;
        popUpStyles.top = targetRect.height + offset.y;
        break;

      case "right-top":
      case "top-right":
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = -(popupRect.height + offset.y);
        break;

      case "top-left":
      case "left-top":
        popUpStyles.left = -popupRect.width - offset.x;
        popUpStyles.top = -(popupRect.height + offset.y);
        break;

      case "right-bottom":
      case "bottom-right":
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = targetRect.height + offset.y;
        break;

      case "left-bottom":
      case "bottom-left":
        popUpStyles.left = -popupRect.width - offset.x;
        popUpStyles.top = targetRect.height + offset.y;
        break;

      case "top-start":
        popUpStyles.left = offset.x;
        popUpStyles.top = -(popupRect.height + offset.y);
        break;
        break;

      case "top-end":
        popUpStyles.left = targetRect.width - popupRect.width - offset.x;
        popUpStyles.top = -(popupRect.height + offset.y);
        break;

      case "bottom-start":
        popUpStyles.left = offset.x;
        popUpStyles.top = targetRect.height + offset.y;
        break;

      case "bottom-end":
        popUpStyles.left = targetRect.width - popupRect.width - offset.x;
        popUpStyles.top = targetRect.height + offset.y;
        break;

      case "right-start":
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = -offset.y;
        break;

      case "right-end":
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = targetRect.height - popupRect.height - offset.y;
        break;

      case "left-start":
        popUpStyles.left = -popupRect.width - offset.x;
        popUpStyles.top = -offset.y;
        break;

      case "left-end":
        popUpStyles.left = -popupRect.width - offset.x;
        popUpStyles.top = targetRect.height - popupRect.height - offset.y;
        break;

      default: // Same as right-center
        popUpStyles.left = targetRect.width + offset.x;
        popUpStyles.top = targetRect.height / 2 - popupRect.height / 2 + offset.y;
        break;
    }
  }

  return popUpStyles;
}

export function findNearestScrollableAncestor(element: HTMLElement | null) {
  if (element === null || element === document.body) {
    return null;
  }

  let { parentElement } = element;
  while (parentElement && parentElement !== document.body) {
    if (
      parentElement.scrollHeight > parentElement.clientHeight ||
      parentElement.scrollWidth > parentElement.clientWidth
    ) {
      return parentElement;
    }
    parentElement = parentElement.parentElement;
  }
  return null;
}

/**
 * Ref: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using#showing_popovers_via_javascript
 * @returns True if browser supports popover api
 */
export function supportsPopover() {
  // eslint-disable-next-line no-prototype-builtins
  return HTMLElement.prototype.hasOwnProperty("popover");
}
