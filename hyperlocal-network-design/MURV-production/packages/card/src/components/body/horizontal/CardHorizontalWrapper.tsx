import React from "react";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledHorizontalItemsContainer } from "../../../styles";
import { IAccessibilityProps, ICardClickableSlotProps } from "../../../types";
import { CardHorizontalSlot } from "./horizontal-slot/CardHorizontalSlot";
import { useCardInteractions } from "../../../hooks/useCardInteractions";

export const CardHorizontalWrapper = (
  props: React.PropsWithChildren<ICardClickableSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles, onClick, ...rest } = props;
  const { onClick: handleClick, ref } = useCardInteractions(onClick);
  const { validChildren: filteredChildren } = isValidChildren({
    allowedTypes: [CardHorizontalSlot],
  })(children);

  return (
    <StyledHorizontalItemsContainer
      tabIndex={onClick ? 0 : -1}
      onClick={handleClick}
      {...rest}
      ref={ref}
      style={{ ...containerStyles }}
    >
      {filteredChildren}
    </StyledHorizontalItemsContainer>
  );
};

CardHorizontalWrapper.Slot = CardHorizontalSlot;
