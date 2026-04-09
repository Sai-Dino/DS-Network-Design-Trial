import React, { PropsWithChildren, forwardRef, useImperativeHandle, useRef } from "react";
import { FocusTrap } from "../focus-trap";
import { IDialogElementRef, IDialogElementProps } from "./types";
import { DialogElement } from "./styles";
import { DIALOG_MODES } from "./constants";

export const DialogNative = forwardRef<IDialogElementRef, PropsWithChildren<IDialogElementProps>>(
  ({ id, mode = DIALOG_MODES.MODAL, dataTestId, className, onClose, children }, forwardedRef) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useImperativeHandle(forwardedRef, () => ({
      open: !!dialogRef.current?.open,
      show: () =>
        mode === DIALOG_MODES.NON_MODAL
          ? dialogRef.current?.show()
          : dialogRef.current?.showModal(),
      close: () => dialogRef.current?.close(),
    }));

    return (
      <DialogElement
        id={id}
        aria-modal={mode !== DIALOG_MODES.NON_MODAL}
        role={mode === DIALOG_MODES.ALERT ? "alertdialog" : "dialog"}
        ref={dialogRef}
        className={className}
        data-testid={dataTestId}
      >
        {mode !== DIALOG_MODES.NON_MODAL ? (
          <FocusTrap
            escapeHandler={(keyEvent) => {
              keyEvent.preventDefault();
              dialogRef.current?.close();
              if (onClose) {
                onClose();
              }
            }}
            className="dialog-focus-trap"
          >
            {children}
          </FocusTrap>
        ) : (
          children
        )}
      </DialogElement>
    );
  },
);
