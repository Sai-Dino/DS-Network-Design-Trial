import React from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledVerticalItemsContainer } from "../../../styles";
import { IAccessibilityProps, ICardClickableSlotProps } from "../../../types";
import { CardVerticalSlot } from "./vertical-slot/CardVerticalSlot";
import { useCardInteractions } from "../../../hooks/useCardInteractions";

export const CardVerticalWrapper = (
  props: React.PropsWithChildren<ICardClickableSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, onClick, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);
  const { validChildren: filteredChildren } = isValidChildren({
    allowedTypes: [CardVerticalSlot],
  })(children);

  return (
    <StyledVerticalItemsContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      {filteredChildren}
    </StyledVerticalItemsContainer>
  );
};

CardVerticalWrapper.Slot = CardVerticalSlot;
