import { IDateRangePickerProps } from "@murv/datepicker";
import { IDropDownButtonProps } from "@murv/dropdown-trigger";

export type RangeDateSelectProps = IDropDownButtonProps &
  IDateRangePickerProps & {
    label: string;
  };
