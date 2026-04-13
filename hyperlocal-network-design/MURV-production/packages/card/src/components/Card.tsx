import React from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { ICardComponent, IAccessibilityProps, ICardProps } from "../types";
import { CardProvider } from "../hooks/useCardContext";
import { StyledCard } from "../styles";
import { CardHeader } from "./header/CardHeader";
import { CardBody } from "./body/CardBody";

const Card: ICardComponent = (props: React.PropsWithChildren<ICardProps & IAccessibilityProps>) => {
  const {
    id,
    testId,
    interactable,
    disabled,
    onClick,
    children,
    role,
    containerStyles = {},
  } = props;

  const isInteractable = interactable && !disabled && onClick;
  const { validChildren: filteredChildren } = isValidChildren({
    allowedTypes: [CardHeader, CardBody],
  })(children);

  const handleClick = () => {
    if (interactable && !disabled && onClick) {
      onClick();
    }
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " " || event.code === "Space") {
      handleClick();
    }
  };
  return (
    <CardProvider interactable={interactable} disabled={disabled} id={id} testId={testId}>
      <StyledCard
        tabIndex={onClick ? 0 : -1}
        {...props}
        id={`murv-card-${id}`}
        data-testid={`murv-card-${testId}`}
        role={role || "group"}
        interactable={interactable ?? false}
        disabled={disabled ?? false}
        {...(isInteractable && { onClick: handleClick, onKeyDown: handleKeyDown })}
        style={{ ...containerStyles }}
      >
        {filteredChildren}
      </StyledCard>
    </CardProvider>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;

export default Card;
