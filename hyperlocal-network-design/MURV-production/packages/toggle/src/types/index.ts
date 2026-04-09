import { CSSProperties, InputHTMLAttributes } from "react";

/**
 * Common's has to abstracted such as position, wrapper and all.
 */

export type ToggleSwitchProps = InputHTMLAttributes<HTMLInputElement>;

export enum SwitchPosition {
  left = "left",
  right = "right",
}

export type ToggleProps = {
  id: string;
  label: string;
  name?: string;
  value?: string;
  description?: string;
  disabled?: boolean;
  switchPosition?: keyof typeof SwitchPosition;
  style?: CSSProperties;
  inputProps?: Omit<ToggleSwitchProps, keyof ToggleProps | "onChange">;
  ariaLabel?: string;
  ariaLabelledby?: string;
  dataTestId?: string;
} & (
  | {
      onChange?: never;
      readOnly?: never;
      checked?: never;
    }
  | {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      readOnly?: boolean;
      checked: boolean;
    }
);
