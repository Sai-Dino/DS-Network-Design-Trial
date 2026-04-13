import { FormatOptions, ParseOptions } from "date-fns";
import React, { MouseEventHandler, MouseEvent, KeyboardEvent } from "react";

export type ORIENTATION = "HORIZONTAL" | "VERTICAL";
export type CalenderType = "SINGLE" | "RANGE";
export type DateType = Date;
export type DynamicKeyObject<T> = { [key: string]: T };
export type SimpleCalenderType = "SIMPLE" | "ADVANCED";
export type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

export type ITableType = "MONTH" | "YEAR" | "DAY";

export type DateFormat = {
  formatStr: string;
  options?: FormatOptions | ParseOptions;
};

export type MaxRange = {
  days?: number;
  months?: number;
  years?: number;
};
export interface ICalendarHeader {
  type: CalenderType;
  navigationAction: (e: MouseEvent | KeyboardEvent) => void;
}

export type ISingleCalendarHeader = {
  month: string;
  year: number;
  subType: SimpleCalenderType;
  handleHeaderCallback: (...args: any[]) => void;
};

export interface INavigationButton {
  navigationAction: (e: MouseEvent | KeyboardEvent) => void;
  calenderType?: CalenderType;
  activeTableType?: ITableType;
}

export type IHeaderLabelText = {
  month: string;
  year: number;
  textLabels: string[] | number[];
  interfix: string;
};

export type IDateRangeOption = {
  title: string;
  dateRange: IDateRange | null;
  isCustom?: boolean;
  defaultSelected?: boolean;
};

export interface IMonthGridProps
  extends ISignleMonthGridProps,
    IRangeMonthGridProps,
    ITimePickerProps {
  calenderType: CalenderType;
  type: SimpleCalenderType;
  onDone?: (props: Pick<IDateProps, "dateRange" | "activeDate">) => void;
  onCancel?: () => void;
  activeCalenderType?: ITableType;
  isDayDisabled?: (day: DateType) => boolean;
  dateRangeOptions?: IDateRangeOption[];
  weekStartsOn?: WeekStartsOn;
}

export interface IRangeFunction {
  onDateChange?(
    {
      startDate,
      endDate,
    }: { startDate: DateType | string | number; endDate: DateType | string | number },
    e?: MouseEvent,
  ): void;
  onMonthChange?: (
    {
      startMonth,
      endMonth,
    }: { startMonth: DateType | string | number; endMonth: DateType | string | number },
    e?: MouseEvent,
  ) => void;
  onYearChange?: (
    {
      startYear,
      endYear,
    }: { startYear: DateType | string | number; endYear: DateType | string | number },
    e?: MouseEvent,
  ) => void;
}

export interface ISignleMonthGridProps {
  selectedDate: DateType;
  onDateClick: MouseEventHandler;
}

export interface IRangeMonthGridProps extends IRangeFunction {
  dateRange?: IDateRange;
  maxRange?: MaxRange;
  header?: JSX.Element;
  dateOutputFormat: DateFormat;
  minDate?: DateType;
  maxDate?: DateType;
}

export interface IDateMouseEvent extends MouseEventHandler {}

export type PartialProps<T, K extends keyof T> = Partial<Extract<T, { [P in K]: any }>>;

export type IHeaderWrapper = ISingleCalendarHeader & INavigationButton & IHeaderLabelText;

export interface IDatePickerProps {
  width?: number;
  testId?: string;
  onDone?: (props: Pick<IDateProps, "dateRange" | "activeDate">) => void;
  onCancel?: () => void;
  className?: string;
  weekStartsOn?: WeekStartsOn;
}

export interface ISingleDatePickerProps extends IDatePickerProps, ITimePickerProps {
  onDateChange?: (date: DateType | string | number, e: MouseEvent) => void;
  type: SimpleCalenderType;
  date: DateType | string | number;
  dateOutputFormat: DateFormat;
  isDayDisabled?: (day: DateType) => boolean;
  isMonthDisabled?: (month: DateType) => boolean;
  isYearDisabled?: (year: DateType) => boolean;
}

export interface IDateRange {
  startDate: DateType | null;
  endDate: DateType | null;
}
export type IMonthRange = { startMonth: DateType | null; endMonth: DateType | null };
export type IYearRange = { startYear: DateType | null; endYear: DateType | null };

export interface IDateRangePickerProps extends IDatePickerProps, IRangeFunction, ITimePickerProps {
  dateRange?: IDateRange;
  maxRange?: MaxRange;
  isDayDisabled?: (day: DateType) => boolean;
  isMonthDisabled?: (month: DateType) => boolean;
  isYearDisabled?: (year: DateType) => boolean;
  activeCalenderType: ITableType;
  header?: JSX.Element;
  dateOutputFormat: DateFormat;
  minDate?: DateType;
  maxDate?: DateType;
  dateRangeOptions?: IDateRangeOption[];
}

export interface IDatePickerState {
  startDate: DateType | null;
  endDate: DateType | null;
  startMonth: string | null;
  endMonth: string | null;
  date: DateType;
  activeTableType: ITableType;
}

export interface ICheckDateUtil {
  startDate: DateType | null;
  endDate: DateType | null;
  calenderType?: CalenderType;
  isWithInSameMonthRange: (date: DateType, index: number) => boolean;
  isWithInRange: (date: DateType) => boolean;
  checkRangeInterval: (date: DateType) => boolean;
  isMonthsWithInRange: (date: DateType) => boolean;
  isHoverMonthsWithInRange: (date: DateType) => boolean;
  isWithInSameSize: (day: DateType, gridType: ITableType, maxDateRange?: number) => boolean;
  isWithInPartialRange: (date: DateType) => boolean;
}

export interface IDateRangeDetail {
  startDate: DateType | null;
  endDate: DateType | null;
  hoverSelectedDate: DateType | null;
}

export interface IMonthRangeDetail {
  startMonth: DateType | null;
  endMonth: DateType | null;
  hoverSelectedMonth: DateType | null;
}

export interface IYearRangeDetail {
  startYear: DateType | null;
  endYear: DateType | null;
  hoverSelectedYear: DateType | null;
}

export interface IObserver {
  observers: Function[];
  subscribe: Function;
  unsubscribe: Function;
  notifyObservers: Function;
  notifyAndGetData: <T extends any[], U>(...args: T) => U[];
}

export interface IDateProps {
  dateRange: IDateRange | null;
  monthRange: IDateRange | null;
  yearRange: IDateRange | null;
  activeDate: DateType | null;
  getRange: (gridType: ITableType) => DateType;
  setRange: Function;
  getCalenderListByType: (
    gridType: ITableType,
    calenderType: CalenderType,
  ) => { [key: string]: Date[][][] | Date[][] } | {};
}

export interface IFooterProps {
  onDone: (props: Pick<IDateProps, "dateRange" | "activeDate">) => void;
  onCancel: () => void;
}

export interface IMonthGridHeader extends ISingleCalendarHeader, INavigationButton {
  activeTableType: ITableType;
}

export interface ICurrentGridState {
  activeDate: DateType;
  currentYearsData: { years: Date[][]; fromToYears: number[][] };
  currentMonthsData: { quarters: Date[][][]; year: number[] };
  currentDaysData: {
    days: Date[][][];
    startMonth: number;
    endMonth: number;
    year: number;
  };
  activeTableType: ITableType;
}

export interface IGridTable {
  gridTableType: ITableType;
  currentGrid: {
    currentGridData: ICurrentGridState;
    setCurrentGridData: React.Dispatch<React.SetStateAction<ICurrentGridState>>;
  };
  calenderType: CalenderType;
  handleNavigation: (e: React.MouseEvent | React.KeyboardEvent) => void;
  handleDateSelect: (
    e: React.MouseEvent<Element, globalThis.MouseEvent>,
    date: Date,
    gridTableType: ITableType,
  ) => void;
  selectedDate: DateType;
  onDateClick: MouseEventHandler;
  maxRange: MaxRange;
  dateRangeValue: IDateRangeDetail;
  handleDateOver: (e: React.PointerEvent<HTMLTableCellElement>, date: Date) => void;
  minDate?: DateType;
  maxDate?: DateType;
  isDayDisabled?: (day: DateType) => boolean;
  isMonthDisabled?: (month: DateType) => boolean;
  isYearDisabled?: (year: DateType) => boolean;
  onTimeChange?: (time: string, type: string) => void;
  timeValue?: string;
  startTime?: string;
  endTime?: string;
  weekStartsOn?: WeekStartsOn;
}

export interface IConditionHandler {
  conditions: Array<{ callBack: (date: DateType) => boolean; expected: boolean }>;
  isAnyConditionValid: (date: DateType) => boolean;
  allConditionsValid: (date: DateType) => boolean;
}

export interface ITimePickerProps {
  timeValue?: string;
  onTimeChange?: (time: string, type: string) => void;
  type?: string;
  startTime?: string;
  endTime?: string;
}
