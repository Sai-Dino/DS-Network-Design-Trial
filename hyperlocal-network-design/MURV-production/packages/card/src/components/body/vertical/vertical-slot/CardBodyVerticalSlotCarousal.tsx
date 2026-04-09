import React from "react";
import Carousal from "@murv/carousel";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledCarousalContainer } from "../../../../styles";
import { IAccessibilityProps, ICardSlotProps } from "../../../../types";

export const CardBodyVerticalSlotCarousal = (
  props: React.PropsWithChildren<ICardSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, ...rest } = props;
  const { isValid, validChildren } = isValidChildren({
    allowedTypes: [Carousal],
    expectedChildrenCount: 1,
  })(children);

  if (!isValid) {
    return null;
  }
  return (
    <StyledCarousalContainer {...rest} style={{ ...containerStyles }}>
      {validChildren}
    </StyledCarousalContainer>
  );
};
