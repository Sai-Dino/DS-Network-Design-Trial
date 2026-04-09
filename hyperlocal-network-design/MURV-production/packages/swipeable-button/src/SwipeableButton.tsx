import React from "react";
import { Swipeable } from "@murv/core/components/swipeable";
import { Button } from "@murv/button";
import { SwipeableButtonProps } from "./types";

export const SwipeableButton: React.FC<SwipeableButtonProps> = ({
  swipeableProps,
  ...buttonProps
}) => (
  <Swipeable {...swipeableProps}>
    <Button {...buttonProps} />
  </Swipeable>
);
