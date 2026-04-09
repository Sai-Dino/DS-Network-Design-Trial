import React, { HTMLAttributes, MouseEventHandler, MouseEvent as ReactMouseEvent } from "react";

export interface ISliderProps {
  /*
  test id
  */
  dataTestId?: string;
  /*
  range Value boolean
  */
  range: boolean;
  /*
  min Value for range
  */
  min?: number;
  /*
  max Value for range
  */
  max?: number;
  /*
  disbaled prop to disable slider
  */
  disabled?: boolean;
  /*
  onChange trigger when value changes
  */
  onChange?: (
    e: ReactMouseEvent | MouseEventHandler | MouseEvent | TouchEvent,
    value: number[] | number,
  ) => void;
  /*
  custom onMouseDown handler if slider thumb is clicked
  */
  onMouseDown?: React.MouseEventHandler;
  /*
  step Value for slider to move
  */
  step?: number;
  /*
  width for slider
  */
  width?: number;
  /*
  input control value for slider
  */
  showInput?: boolean;
  /*
  html Props for slider
  */
  htmlProps?: HTMLAttributes<HTMLDivElement>;
}
