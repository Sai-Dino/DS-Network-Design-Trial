import React from "react";
import { ButtonGroup } from "@murv/button-group";
import { useModalControls } from "../../provider/ModalController";
import { IModalActions } from "../../types";

export const ConfirmationModalActions: React.FC<IModalActions> = ({ actions, dataTestId }) => {
  const { modalId } = useModalControls();
  return (
    <ButtonGroup
      id={`${modalId}-confirmation-modal-actions`}
      alignment="left"
      buttons={actions}
      dataTestId={dataTestId}
    />
  );
};
