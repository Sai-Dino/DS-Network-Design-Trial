import { SwipeableProps } from "@murv/core/components/swipeable";
import { ButtonProps } from "@murv/button/src/types";

export interface SwipeableButtonProps extends ButtonProps {
  /**
   * Swipeable Config
   */
  swipeableProps?: SwipeableProps;
}
