import React from "react";
import { useModalControls } from "../../provider/ModalController";
import { generateDialogContentId } from "../../utils";
import { ContentWrapper } from "./styles";
import { IDataTestIdProps } from "../../types";

export const LaunchModalContent: React.FC<IDataTestIdProps> = ({ children, dataTestId }) => {
  const { modalId } = useModalControls();
  return (
    <ContentWrapper id={generateDialogContentId(modalId)} data-testid={dataTestId}>
      {children}
    </ContentWrapper>
  );
};
