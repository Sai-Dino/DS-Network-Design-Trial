import { SingleSelectProps } from "@murv/single-select";
import { RangeDateSelectProps } from "packages/range-date-select/src/types";
import React, { ReactElement } from "react";
import {
  ITableType,
  DateFormat,
  IDateProps,
  DateType,
  IDateRange,
  MaxRange,
  IDateRangeOption,
  WeekStartsOn,
} from "@murv/datepicker";

/*
 * Interface describing the props for <SegmentedControl.Options />
 * Since this is a interface, it can be further expanded by user
 */
export interface ISegmentedControlOptionsProps {
  text: string;
  badgeCount?: number;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
  selectCurrentOption?: () => void;
  label: string;
}

/*
 * Interface describing the props for <SegmentedControl.MoreOptions />
 * Only the required props are passed from this for more options Select.
 */
export interface ISegmentedControlMoreOptionsProps {
  badgeCount?: number;
  isSelected?: boolean;
  defaultSelected?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  disabled?: boolean;
  selectCurrentOption?: () => void;
  moreOptionProps: Pick<
    SingleSelectProps,
    | "id"
    | "value"
    | "onChange"
    | "options"
    | "dataTestId"
    | "checkMarkPosition"
    | "maxBadgeWidth"
    | "showCheckedValue"
    | "withSearch"
    | "onSearch"
    | "placeholder"
    | "showBadge"
  >;
  text: string;
  label: string;
}
/*
 * Interface describing the props for <SegmentedControl />
 * Since this is a interface, it can be further expanded by user
 */
export interface ISegmentedControlProps {
  id: string;
  dataTestId: string;
  children:
    | ReactElement<ISegmentedControlOptionsProps>
    | ReactElement<ISegmentedControlOptionsProps>[];
  disabled?: boolean;
  legend?: string;
}

export type ISegmentedControlOptionWrapperProps = {
  defaultSelected?: boolean;
  isSelected?: boolean;
  disabled?: boolean;
};

export type IOptionsTextProps = {
  disabled?: boolean;
};

export type THandlerRef = {
  setSelectedIndex: (val?: number | null) => void;
};

export interface ISegmentedControlDateRangeProps
  extends Omit<
    RangeDateSelectProps,
    | "onDateChange"
    | "label"
    | "orientation"
    | "withBorder"
    | "renderButtonIcon"
    | "activeCalenderType"
    | "dateOutputFormat"
  > {
  id?: string;
  testId?: string;
  text?: string;
  onDateChange?: (params: { startDate: string; endDate: string }) => void;
  activeCalenderType: ITableType;
  dateOutputFormat: DateFormat;
  onDone?: (props: Pick<IDateProps, "dateRange" | "activeDate">) => void;
  onCancel?: () => void;
  onTimeChange?: (time: string, type: string) => void;
  defaultSelected?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  selectCurrentOption?: () => void;
  isSelected?: boolean;
  isDayDisabled?: (day: DateType) => boolean;
  isMonthDisabled?: (month: DateType) => boolean;
  isYearDisabled?: (year: DateType) => boolean;
  dateRange?: IDateRange;
  maxRange?: MaxRange;
  header?: JSX.Element;
  minDate?: DateType;
  maxDate?: DateType;
  dateRangeOptions?: IDateRangeOption[];
  weekStartsOn?: WeekStartsOn;
}
