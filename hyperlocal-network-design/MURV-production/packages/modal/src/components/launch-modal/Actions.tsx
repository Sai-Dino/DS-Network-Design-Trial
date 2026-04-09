import React from "react";
import { ButtonGroup } from "@murv/button-group";
import { useModalControls } from "../../provider/ModalController";
import { IModalActions } from "../../types";

export const LaunchModalActions: React.FC<IModalActions> = ({ actions, dataTestId }) => {
  const { modalId } = useModalControls();
  return (
    <ButtonGroup
      id={`${modalId}-launch-modal-actions`}
      alignment="center"
      buttons={actions}
      dataTestId={dataTestId}
    />
  );
};
