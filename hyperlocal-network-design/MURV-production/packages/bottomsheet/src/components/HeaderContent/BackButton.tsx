import React from "react";
import { Button } from "@murv/button";
import { ArrowBack } from "@murv/icons";
import { BackIconWrapper } from "../styles";
import { IBackIconProps } from "../../types";

export const BackNavigation: React.FC<IBackIconProps> = ({ onBack }) => (
  <BackIconWrapper>
    <Button
      buttonStyle="neutral"
      buttonType="inline"
      size="small"
      onClick={onBack}
      dataTestId="bottomsheet-back-icon-button"
    >
      <ArrowBack size="20px" />
    </Button>
  </BackIconWrapper>
);
