import React from "react";
import { ButtonGroup } from "@murv/button-group";
import { TFooterProps } from "../types";
import { FooterArea } from "../styles";

export const DrawerFooter: React.FC<TFooterProps> = ({ buttonGroupProps }) =>
  buttonGroupProps ? (
    <FooterArea>
      <ButtonGroup {...buttonGroupProps} padding="0px" />
    </FooterArea>
  ) : null;
