import React, { InputHTMLAttributes, RefObject } from "react";

export interface IInputContainerProps {
  isActive: boolean;
}

export type EventInterface =
  | HTMLDivElement
  | HTMLInputElement
  | HTMLImageElement
  | HTMLTextAreaElement;
export interface IInputProps {
  /**
   * The value of the input text
   */
  value: string | number | readonly string[];
  /**
   * The placeholder if text is empty.
   */
  placeholder: string;
  /**
   * Setting device orientation.
   */
  deviceOrientation?: "desktop" | "desktopHorizontal" | "mobile";
  /**
   * The label message to display.
   */
  label?: string;
  /**
   * The input tag required.
   */
  optional?: boolean;
  /**
   * The words count of text typed in textbox/textarea.
   */
  count?: boolean;
  /**
   * The icon to be displayed for onclick events
   */
  actionIcon?: React.ReactNode;
  /**
   * The icon to be displayed as prefix to input.
   */
  prefixIcon?: React.ReactNode;
  /**
   * The icon to be displayed after input tag.
   */
  suffixIcon?: React.ReactNode;
  /**
   * The textbox/textarea will be disabled.
   */
  disabled?: boolean;
  /**
   * apss test id for testing purposes.
   */
  testId?: string;
  /**
   * Passing error boolean if value entered is not valid.
   */
  isError?: boolean;
  /**
   * Passing width string.
   */
  width?: string | number;
  /**
   * adding tabIndex keyboard controls .
   */
  tabIndex?: number;
  /**
   * add compact boolean to inline label & input .
   */
  compact?: boolean;
  /**
   * Additional Html props to extend.
   */
  inputHtmlProps?: Omit<
    InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    "onFocus" | "onClick" | "maxLength" | "type"
  >;
  /**
   * Passing onchange function when text entry has happened.
   */
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    state?: string,
  ) => void;
  /**
   * Passing onhover function when component is hovered.
   */
  onHover?: (e: React.MouseEvent<EventInterface>) => void;
  /**
   * Passing onhover function when component is pressed.
   */
  onFocus?: React.FocusEventHandler<HTMLInputElement & HTMLTextAreaElement & HTMLDivElement>;
  /**
   * Passing onclick function when component is clicked.
   */
  onClick?: React.MouseEventHandler<HTMLInputElement & HTMLTextAreaElement & HTMLDivElement>;
  /**
   * The input type to be displayed.
   */
  type: "text" | "password" | "email" | "number" | "tel";
  maxLength?: number;
  /**
   * Passing onKeyPress function when key is pressed.
   */
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  autoFocus?: boolean;
  /**
   * The ref attribute
   */
  inputRef?: RefObject<HTMLInputElement | HTMLTextAreaElement> | null;
}
export type FieldType = "active" | "focus" | "hover" | "default" | "error" | "pressed";

export interface IInputWithLabelProps extends IInputProps {
  label?: string;
  helpText?: string;
}
