import React from "react";
import { ILaunchModalHeader } from "../../types";
import { useModalControls } from "../../provider/ModalController";
import { generateDialogHeaderId } from "../../utils";
import { HeaderWrapper } from "./styles";

export const LaunchModalHeader: React.FC<ILaunchModalHeader> = ({
  header,
  subHeader,
  dataTestId,
}) => {
  const { modalId } = useModalControls();
  return (
    <HeaderWrapper id={generateDialogHeaderId(modalId)} data-testid={dataTestId} tabIndex={-1}>
      <h3>{header}</h3>
      <p>{subHeader}</p>
    </HeaderWrapper>
  );
};
