import React, { useRef } from "react";

export type IFocusTrap = React.HTMLAttributes<HTMLDivElement> & {
  escapeHandler: (keyEvent: React.KeyboardEvent<HTMLDivElement>) => void;
  returnFocusToTrigger?: boolean;
};

/**
 * A wrapper component to trap focus within the children.
 * If you intend to use the focus trap feature, please ensure you provide the users with a way to exit the focus trapped area.
 */
export const FocusTrap: React.FC<IFocusTrap> = ({
  children,
  escapeHandler,
  returnFocusToTrigger = false,
  ...remainingProps
}) => {
  const modalTriggerElementRef = useRef<HTMLButtonElement | null>(null);

  const onKeyDown = (keyEvent: React.KeyboardEvent<HTMLDivElement>) => {
    if (remainingProps.onKeyDown) {
      remainingProps.onKeyDown(keyEvent);
    }
    if (keyEvent.key === "Escape" && !!escapeHandler) {
      escapeHandler(keyEvent);
      if (returnFocusToTrigger && modalTriggerElementRef.current) {
        // Returning focus to the element that previously has focus before the modal was shown.
        modalTriggerElementRef.current.focus();
      }
    }
  };

  return (
    /* eslint-disable jsx-a11y/no-static-element-interactions */
    <div
      {...remainingProps}
      onKeyDown={onKeyDown}
      ref={(ref) => {
        if (ref) {
          const tabbableElementsSelector = [
            "a[href]",
            "area[href]",
            "input:not([disabled])",
            "select:not([disabled])",
            "textarea:not([disabled])",
            "button:not([disabled])",
            "details",
            "summary",
            "iframe",
            "object",
            "embed",
            "video",
            "[contenteditable]",
            '[tabindex]:not([tabindex="-1"])',
          ].join(",");
          /**
           * The logic used here to determine all focussable chidlren needs to be revisited as the HTML spec evolves.
           */
          const tabbableChildren = [
            ...ref.querySelectorAll<HTMLElement>(tabbableElementsSelector),
          ].filter(
            (el) =>
              !el.hasAttribute("disabled") &&
              !el.hasAttribute("hidden") &&
              !el.getAttribute("aria-hidden"),
          );
          const tabbableChildrenCount = tabbableChildren.length;

          if (tabbableChildrenCount > 0) {
            tabbableChildren[0].onkeydown = (keyEvent: KeyboardEvent) => {
              if (keyEvent.key === "Tab" && keyEvent.shiftKey) {
                keyEvent.preventDefault();
                tabbableChildren[tabbableChildrenCount - 1].focus();
              }
            };

            tabbableChildren[tabbableChildrenCount - 1].onkeydown = (keyEvent: KeyboardEvent) => {
              if (keyEvent.key === "Tab" && !keyEvent.shiftKey) {
                keyEvent.preventDefault();
                tabbableChildren[0].focus();
              }
            };
          }
        }
      }}
      onFocusCapture={(focusEvent) => {
        if (!modalTriggerElementRef.current) {
          // Saving a reference to the element that was previously focussed before entering the dialog so that we can return focus to that element on close.
          modalTriggerElementRef.current = focusEvent.relatedTarget as HTMLButtonElement;
        }
      }}
    >
      {children}
    </div>
  );
};

/**
 * @param Component
 * @returns A component that wraps the input component with FocusTrap.
 *
 * A HOC (Higher Order Component) to trap focus within a component.
 * If you intend to use the focus trap feature, please ensure you provide the users with a way to exit the focus trapped area.
 */
export const WithFocusTrap =
  <T extends React.JSX.IntrinsicAttributes>(
    Component: React.ComponentType<T>,
    escapeHandler: IFocusTrap["escapeHandler"],
  ): React.ComponentType<T> =>
  (props: T) =>
    (
      <FocusTrap escapeHandler={escapeHandler}>
        <Component {...props} />
      </FocusTrap>
    );
