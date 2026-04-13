import React, {
  PropsWithChildren,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { FocusTrap } from "../focus-trap";
import { IDialogElementRef, IDialogElementProps } from "./types";
import { DialogPolyfillElement, DialogPolyfillWrapper } from "./styles";
import {
  AUTOFOCUS_ELEMENTS_SELECTOR,
  DIALOG_MODES,
  FOCUSSABLE_ELEMENTS_SELECTOR,
} from "./constants";

export const DialogPolyfill = forwardRef<IDialogElementRef, PropsWithChildren<IDialogElementProps>>(
  (
    { id, dataTestId, mode, ariaLabelledBy, ariaDescribedBy, className, onClose, children },
    forwardedRef,
  ) => {
    const dialogElementRef = useRef<HTMLDivElement>(null);
    const [isVisible, setVisibility] = useState(false);

    const closeModal = () => {
      setVisibility(false);
    };

    useImperativeHandle(forwardedRef, () => ({
      open: isVisible,
      show: () => {
        setVisibility(true);
      },
      close: closeModal,
    }));

    useEffect(() => {
      if (isVisible && mode !== DIALOG_MODES.NON_MODAL) {
        const keyboardFocusableElements = [
          ...(dialogElementRef.current?.querySelectorAll(AUTOFOCUS_ELEMENTS_SELECTOR) ?? []),
          ...(dialogElementRef.current?.querySelectorAll(FOCUSSABLE_ELEMENTS_SELECTOR) ?? []),
        ].filter(
          (el) =>
            !el.hasAttribute("disabled") &&
            !el.hasAttribute("hidden") &&
            !el.getAttribute("aria-hidden"),
        );
        // @ts-ignore
        keyboardFocusableElements[0]?.focus();
      }
    }, [isVisible]);

    return (
      <DialogPolyfillWrapper hidden={!isVisible} data-testid={dataTestId}>
        <DialogPolyfillElement
          id={id}
          aria-modal={mode !== DIALOG_MODES.NON_MODAL}
          role={mode === DIALOG_MODES.ALERT ? "alertdialog" : "dialog"}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          hidden={!isVisible}
          className={className}
          ref={dialogElementRef}
        >
          {mode !== DIALOG_MODES.NON_MODAL ? (
            <FocusTrap
              escapeHandler={(keyEvent) => {
                keyEvent.preventDefault();
                closeModal();
                if (onClose) {
                  onClose();
                }
              }}
              returnFocusToTrigger
              className="dialog-focus-trap"
            >
              {children}
            </FocusTrap>
          ) : (
            children
          )}
        </DialogPolyfillElement>
      </DialogPolyfillWrapper>
    );
  },
);
