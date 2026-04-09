import { CheckMarkGroupSearchProps } from "@murv/checkmark/src/types";
import { IDropDownButtonProps } from "@murv/dropdown-trigger";

export type SingleSelectProps = IDropDownButtonProps &
  Omit<CheckMarkGroupSearchProps, "onChange"> & {
    label: string;
    withSearch?: boolean;
    popOverWidth?: string;
    onChange: (selectedValue: string) => void;
    showBadge?: boolean;
    buttonWidth?: string;
    prefixButtonIcon?: () => React.JSX.Element | undefined;
    showReset?: boolean;
  };
