import { InputHTMLAttributes, CSSProperties } from "react";

export enum CheckMarkPosition {
  left = "left",
  right = "right",
}

export enum CheckMarkOrientation {
  horizontal = "horizontal",
  vertical = "vertical",
}

export interface CheckMarkProps extends InputHTMLAttributes<HTMLInputElement> {
  "data-label"?: string;
}

type OptionMeta = {
  id?: string;
  label: string;
  value: string;
  description?: string;
  disabled?: boolean;
};

export type Option = OptionMeta & {
  inputProps?: Omit<CheckMarkProps, keyof OptionMeta | keyof CheckMarkOptionProps | "onChange">;
};

export type CheckMarkOptionProps = Option & {
  id: string;
  name: string;
  checked?: boolean;
  checkMarkPosition?: keyof typeof CheckMarkPosition;
  style?: CSSProperties;
};

export type CheckMarkGroupProps = {
  options: Array<Option>;
  name: string;
  orientation?: keyof typeof CheckMarkOrientation;
  checkMarkPosition?: keyof typeof CheckMarkPosition;
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

export type CheckMarkGroupSearchProps = CheckMarkGroupProps & {
  showCheckedValue?: boolean;
  id: string;
  name?: string;
  placeholder?: string;
  onSearch?: (query: string, id: string) => void;
  debounceTimer?: number;
  disabled?: boolean;
};
