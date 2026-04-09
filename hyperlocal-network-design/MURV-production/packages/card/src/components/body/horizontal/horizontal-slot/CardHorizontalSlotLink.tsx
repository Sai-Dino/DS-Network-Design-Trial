import React from "react";
import Link from "@murv/link";
import isValidChildren from "@murv/core/utils/validate-children";
import { StyledLinkHolder } from "../../../../styles";
import { IAccessibilityProps, ICardSlotProps } from "../../../../types";

export const CardHorizontalSlotLink = (
  props: React.PropsWithChildren<ICardSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, ...rest } = props;
  const { isValid, validChildren } = isValidChildren({
    allowedTypes: [Link],
    expectedChildrenCount: 1,
  })(children);

  if (!isValid) {
    return null;
  }
  return (
    <StyledLinkHolder {...rest} style={{ ...containerStyles }}>
      {validChildren}
    </StyledLinkHolder>
  );
};
