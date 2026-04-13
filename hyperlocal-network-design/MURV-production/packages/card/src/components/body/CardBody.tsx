import React from "react";
import { useCardInteractions } from "../../hooks/useCardInteractions";
import { StyledBodyContainer } from "../../styles";
import { ICardClickableSlotProps } from "../../types";
import { CardVerticalWrapper } from "./vertical/CardVerticalWrapper";
import { CardHorizontalWrapper } from "./horizontal/CardHorizontalWrapper";

export const CardBody = (props: React.PropsWithChildren<ICardClickableSlotProps>) => {
  const { children, containerStyles = {}, onClick, ...rest } = props;
  const { id, testId, onClick: handleClick, ref } = useCardInteractions(onClick);
  const childrenArray = Array.isArray(children) ? children : [children];
  const isValid =
    childrenArray.every((child: any) => child.type === CardBody.HorizontalItem) ||
    childrenArray.every((child: any) => child.type === CardBody.VerticalItem);
  if (!isValid) {
    return null;
  }
  return (
    <StyledBodyContainer
      id={`murv-card-body-${id}`}
      data-testid={`murv-card-body-${testId}`}
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      {children}
    </StyledBodyContainer>
  );
};

CardBody.HorizontalItem = CardHorizontalWrapper;
CardBody.VerticalItem = CardVerticalWrapper;
