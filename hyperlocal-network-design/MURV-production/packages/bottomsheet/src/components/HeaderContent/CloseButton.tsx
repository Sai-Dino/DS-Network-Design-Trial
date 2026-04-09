import React from "react";
import { Button } from "@murv/button";
import { Close } from "@murv/icons";
import { CloseIconWrapper } from "../styles";
import { ICloseIconProps } from "../../types";

export const CloseIcon: React.FC<ICloseIconProps> = ({ closeSheet }) => (
  <CloseIconWrapper>
    <Button
      buttonStyle="neutral"
      buttonType="inline"
      size="small"
      onClick={closeSheet}
      dataTestId="bottomsheet-close-icon-button"
    >
      {/** @ts-ignore */}
      <Close size="20px" />
    </Button>
  </CloseIconWrapper>
);
