import React from "react";
import { Button } from "@murv/button";
import { Close } from "@murv/icons";
import { THeaderProps } from "../types";
import {
  HeaderArea,
  HeaderSecondaryTitle,
  HeaderTitle,
  HeaderTitleArea,
  HeaderTitleContainer,
  IconWrapper,
} from "../styles";
import { useDrawerContext } from "../provider/DrawerProvider";

export const DrawerHeader: React.FC<THeaderProps> = ({ icon, title, subTitle }) => {
  const { id, dataTestId, closeDrawer } = useDrawerContext();

  return (
    <HeaderArea>
      <HeaderTitleContainer>
        {icon && <IconWrapper>{icon}</IconWrapper>}
        <HeaderTitleArea>
          <HeaderTitle>{title}</HeaderTitle>
          {subTitle && <HeaderSecondaryTitle>{subTitle}</HeaderSecondaryTitle>}
        </HeaderTitleArea>
      </HeaderTitleContainer>
      <Button
        buttonStyle="neutral"
        buttonType="inline"
        size="large"
        data-testid={`${dataTestId}-button`}
        id={`${id}-button`}
        onClick={closeDrawer}
      >
        {/** @ts-ignore */}
        <Close />
      </Button>
    </HeaderArea>
  );
};
