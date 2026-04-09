import React from "react";
import { Close } from "@murv/icons";
import { Button } from "@murv/button";
import { IConfirmationModalHeader } from "../../types";
import { useModalControls } from "../../provider/ModalController";
import { generateDialogHeaderId } from "../../utils";
import { HeaderWrapper } from "./styles";

export const ConfirmationModalHeader: React.FC<IConfirmationModalHeader> = ({
  header,
  onCloseIconClick,
  dataTestId,
  showCloseIcon = true,
}) => {
  const { modalId, closeModal } = useModalControls();
  return (
    <HeaderWrapper data-testid={dataTestId}>
      <h3 id={generateDialogHeaderId(modalId)}>{header}</h3>
      {showCloseIcon && (
        <Button
          buttonStyle="neutral"
          buttonType="inline"
          size="small"
          onClick={() => {
            closeModal();
            if (onCloseIconClick) onCloseIconClick();
          }}
          dataTestId={`${dataTestId}-close-icon-button`}
        >
          {/** @ts-ignore */}
          <Close />
        </Button>
      )}
    </HeaderWrapper>
  );
};
