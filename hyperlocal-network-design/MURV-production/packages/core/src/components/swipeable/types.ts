import { SwipeEventData, TapCallback } from "react-swipeable";

export interface SwipeableProps {
  onSwiped?: (eventData: SwipeEventData) => void;
  onSwipedLeft?: (eventData: SwipeEventData) => void;
  onSwipedRight?: (eventData: SwipeEventData) => void;
  onSwipedUp?: (eventData: SwipeEventData) => void;
  onSwipedDown?: (eventData: SwipeEventData) => void;
  onTap?: TapCallback;
  /**
   *   min distance(px) before a swipe starts.
   *  Delta can be either a number or an object specifying different deltas for each direction, [left, right, up, down], direction values are optional;
   */
  delta?: number | { left?: number; right?: number; up?: number; down?: number };
  /**
   * prevents scroll during swipe
   */
  preventScrollOnSwipe?: boolean;
  /**
   * to track touch input
   */
  trackTouch?: boolean;
  /**
   * to track mouse input
   */
  trackMouse?: boolean;
  /**
   * allowable duration of a swipe (ms).
   */
  swipeDuration?: number;
}
