import { InputHTMLAttributes, CSSProperties } from "react";

export enum RadioPosition {
  left = "left",
  right = "right",
}

export enum RadioOrientation {
  horizontal = "horizontal",
  vertical = "vertical",
}

export type RadioProps = InputHTMLAttributes<HTMLInputElement>;

type OptionMeta = {
  id?: string;
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
};

type Option = OptionMeta & {
  inputProps?: Omit<RadioProps, keyof OptionMeta | keyof RadioOptionProps | "onChange">;
};

export type RadioOptionProps = Option & {
  id: string;
  name: string;
  checked?: boolean;
  radioPosition?: keyof typeof RadioPosition;
  style?: CSSProperties;
};

export type RadioGroupProps = {
  options: Array<Option>;
  name: string;
  orientation?: keyof typeof RadioOrientation;
  radioPosition?: keyof typeof RadioPosition;
  ariaLabelledby?: string;
  ariaLabel?: string;
  dataTestId?: string;
  style?: CSSProperties;
  onHover?: (e: React.MouseEvent<HTMLInputElement>) => void;
} & (
  | {
      onChange?: never;
      value?: never;
      readOnly?: never;
    }
  | {
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      value: string;
      readOnly?: boolean;
    }
);
