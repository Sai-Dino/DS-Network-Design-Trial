import React from "react";
import {
  TCardHeaderComponent,
  ICardHeaderProps,
  IAccessibilityProps,
  TCardImageComponent,
} from "../../types";
import { useCardContext } from "../../hooks/useCardContext";
import {
  StyledHeaderContainer,
  StyledHeaderIconContainer,
  StyledHeaderTitleContainer,
  StyledHeaderTagContainer,
  StyledHeaderMenuContainer,
  StyledHeaderIconTitleContainer,
} from "../../styles";
import { CardHeaderTag } from "./CardHeaderTag";
import { CardMenuButton } from "./CardMenuButton";
import { ImageComponent } from "../common/CardImageHolder";

export const CardHeader: TCardHeaderComponent = (
  props: React.PropsWithChildren<ICardHeaderProps & IAccessibilityProps>,
) => {
  const { title, isActionable, containerStyles = {}, children } = props;
  const { interactable, id, testId } = useCardContext();
  const childrenArray = Array.isArray(children) ? children : [children];
  const icon = childrenArray.find((child: any) => child?.type === CardHeader.Icon);
  const tag = childrenArray.find((child: any) => child?.type === CardHeader.Tag);
  const menuElement = childrenArray.find((child: any) => child?.type === CardHeader.MenuElement);
  return (
    <StyledHeaderContainer
      id={`murv-card-header-${id}`}
      data-testid={`murv-card-header-${testId}`}
      style={{ ...containerStyles }}
      {...props}
    >
      <StyledHeaderIconTitleContainer>
        {icon && (
          <StyledHeaderIconContainer
            id={`murv-card-header-icon-${id}`}
            data-testid={`murv-card-header-icon-${testId}`}
          >
            {icon}
          </StyledHeaderIconContainer>
        )}
        {title && (
          <StyledHeaderTitleContainer
            id={`murv-card-header-title-${id}`}
            data-testid={`murv-card-header-title-${testId}`}
          >
            {title}
          </StyledHeaderTitleContainer>
        )}
      </StyledHeaderIconTitleContainer>
      {tag && (
        <StyledHeaderTagContainer
          id={`murv-card-header-tag-${id}`}
          data-testid={`murv-card-header-tag-${testId}`}
        >
          {tag}
        </StyledHeaderTagContainer>
      )}
      {isActionable && interactable && menuElement && (
        <StyledHeaderMenuContainer
          id={`murv-card-header-menu-${id}`}
          data-testid={`murv-card-header-menu-${testId}`}
          {...props}
        >
          {menuElement}
        </StyledHeaderMenuContainer>
      )}
    </StyledHeaderContainer>
  );
};

export const CardHeaderIcon: TCardImageComponent = ImageComponent;

CardHeader.Icon = CardHeaderIcon;
CardHeader.Tag = CardHeaderTag;
CardHeader.MenuElement = CardMenuButton;
