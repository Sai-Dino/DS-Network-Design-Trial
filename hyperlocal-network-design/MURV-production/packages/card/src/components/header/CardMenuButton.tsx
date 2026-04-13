import React from "react";
import Button from "@murv/button";
import Tooltip from "@murv/tooltip";
import isValidChildren from "@murv/core/utils/validate-children";
import { IAccessibilityProps, ICardSlotProps } from "../../types";

export const CardMenuButton = (
  props: React.PropsWithChildren<ICardSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, ...rest } = props;
  const { isValid, validChildren } = isValidChildren({
    allowedTypes: [Button, Tooltip],
    expectedChildrenCount: 1,
  })(children);

  if (!isValid) {
    return null;
  }
  return (
    <div {...rest} style={{ ...containerStyles }}>
      {validChildren}
    </div>
  );
};
