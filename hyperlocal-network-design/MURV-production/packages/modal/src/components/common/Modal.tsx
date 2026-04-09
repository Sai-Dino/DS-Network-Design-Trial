import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "@murv/core/components/dialog";
import type { IDialogElementRef } from "@murv/core/components/dialog";
import { ModalController } from "../../provider/ModalController";
import { IModal } from "../../types";
import { useModalsContext } from "../../provider/ModalsProvider";
import { generateDialogContentId, generateDialogHeaderId } from "../../utils";

export const Modal: React.FC<IModal & { className: string }> = ({
  modalId,
  onClose,
  children,
  className,
  dataTestId,
}) => {
  const dialogRef = useRef<IDialogElementRef>(null);
  const { modalsStack, closeModal } = useModalsContext();

  useEffect(() => {
    if (modalsStack[0] === modalId && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.show();
    } else if (dialogRef.current?.open && modalsStack[0] !== modalId) {
      dialogRef.current.close();
      if (onClose) {
        onClose();
      }
    }
  }, [modalsStack]);

  return createPortal(
    <Dialog
      dataTestId={dataTestId}
      id={modalId}
      ref={dialogRef}
      className={className}
      onClose={() => closeModal(modalId)}
      ariaLabelledBy={generateDialogHeaderId(modalId)}
      ariaDescribedBy={generateDialogContentId(modalId)}
      mode="alert"
    >
      <ModalController modalId={modalId}>{children}</ModalController>
    </Dialog>,
    document.body,
  );
};
