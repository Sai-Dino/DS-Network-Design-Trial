import { ISingleDatePickerProps } from "@murv/datepicker";
import { IDropDownButtonProps } from "@murv/dropdown-trigger";

export type SingleDateSelectProps = IDropDownButtonProps &
  Omit<ISingleDatePickerProps, "onDateChange"> & {
    label: string;
    onDateChange: (selectedValue: Date | string | number) => void;
  };
