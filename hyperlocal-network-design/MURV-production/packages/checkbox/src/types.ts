import { InputHTMLAttributes } from "react";

export enum CheckboxPosition {
    left = "left",
    right = "right",
}

export enum CheckboxOrientation {
    horizontal = "horizontal",
    vertical = "vertical",
}

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean };

type OptionMeta = {
    id?: string;
    label?: string;
    value?: string;
    description?: string;
    disabled?: boolean;
}

type Option = OptionMeta & {
    inputProps?: Omit<CheckboxProps, keyof OptionMeta | keyof CheckboxWithLabelProps | "onChange">;
};

export type CheckboxWithLabelProps = Option & {
    id: string;
    name?: string;
    checked?: boolean;
    indeterminate?: boolean;
    checkboxPosition?: keyof typeof CheckboxPosition;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type CheckboxGroupProps = {
    options: Array<Option>;
    orientation?: keyof typeof CheckboxOrientation;
    ariaLabelledby?: string;
    ariaLabel?: string;
    checkboxPosition?: keyof typeof CheckboxPosition;
    onHover?: (e: React.MouseEvent<HTMLInputElement>) => void;
    dataTestId: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value: Array<string>;
    readOnly?: boolean;
}

