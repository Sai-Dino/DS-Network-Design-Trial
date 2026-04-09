import React from "react";
import Tag from "@murv/tag";
import Button from "@murv/button";
import isValidChildren from "@murv/core/utils/validate-children";
import { IAccessibilityProps, ICardSlotProps } from "../../types";

export const CardHeaderTag = (
  props: React.PropsWithChildren<ICardSlotProps & IAccessibilityProps>,
) => {
  const { children, containerStyles = {}, ...rest } = props;
  const { isValid, validChildren } = isValidChildren({
    allowedTypes: [Tag, Button],
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
