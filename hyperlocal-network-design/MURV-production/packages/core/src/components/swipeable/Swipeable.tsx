import React from "react";
import { useSwipeable } from "react-swipeable";
import { SwipeableProps } from "./types";
import { DEFAULT_SWIPEABLE_CONFIG } from "./constants";
import { SwipeableWrapper } from "./styles";

export const Swipeable: React.FC<SwipeableProps> = ({
  onSwiped,
  onSwipedLeft,
  onSwipedRight,
  onSwipedUp,
  onSwipedDown,
  onTap,
  delta = DEFAULT_SWIPEABLE_CONFIG.delta,
  preventScrollOnSwipe = DEFAULT_SWIPEABLE_CONFIG.preventScrollOnSwipe,
  trackTouch = DEFAULT_SWIPEABLE_CONFIG.trackTouch,
  trackMouse = DEFAULT_SWIPEABLE_CONFIG.trackMouse,
  swipeDuration = DEFAULT_SWIPEABLE_CONFIG.swipeDuration,
  children,
}) => {
  const config = {
    onSwiped,
    onSwipedLeft,
    onSwipedRight,
    onSwipedUp,
    onSwipedDown,
    onTap,
    delta,
    preventScrollOnSwipe,
    trackTouch,
    trackMouse,
    swipeDuration,
  };

  const handlers = useSwipeable(config);

  return <SwipeableWrapper {...handlers}>{children}</SwipeableWrapper>;
};
