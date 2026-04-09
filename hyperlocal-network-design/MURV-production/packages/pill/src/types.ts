import React, { HTMLAttributes, MouseEvent, FocusEvent } from "react";

export interface PillProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * When true, the component is active.
   */
  selected?: boolean;
  /**
   * Pass Pill label text
   */
  label: string;
  /**
   * When true, interactions are prevented and the component is displayed with lower opacity.
   */
  disabled?: boolean;
  /**
   * Pass action on pill component click
   */
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Pass test id for test cases
   */
  testId?: string;
  /**
   * Passing onhover function when component is focused.
   */
  onFocus?: (event: FocusEvent<HTMLDivElement, Element>) => void;
  /**
   * Passing onhover function when component is hovered.
   */
  onHover?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Pass Pill id
   */
  id?: string;
  /**
   * Pass icon from @murv/icons
   */
  prefixIcon?: React.ReactNode;
  /**
   * Pass icon form @murv/icons after label
   */
  suffixIcon?: React.ReactNode;
  /**
   * action on suffix icon
   */
  suffixIconCallBack?: (event: MouseEvent<HTMLDivElement>) => void;
  /**
   * Replace prefix icon with tick icon
   */
  isPrefixReplaceable?: boolean;
  /**
   * tab index value
   */
  tabIndex?: number;
  /**
   * Pass the value oof the Pill with Label.
   * This is used to distinguish between pills.
   */
  value: string;
}
