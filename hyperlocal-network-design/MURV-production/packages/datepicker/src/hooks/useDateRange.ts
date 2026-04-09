import { useRef, useState, PointerEvent, MouseEvent, useCallback } from "react";
import throttle from "lodash.throttle";
import { FormatOptions, endOfMonth, endOfYear, format } from "date-fns";
import {
  DateType,
  IDateRangeDetail,
  ITableType,
  IRangeMonthGridProps,
  IDateRange,
  IMonthRange,
  IYearRange,
  IObserver,
  DateFormat,
} from "../types";
import { OnChangeObserver } from "../utils";

function useDateRange({
  onDateChange,
  dateRange,
  dateFormat,
}: {
  activeCalendar: ITableType;
  dateRange?: IDateRange | {};
  monthRange?: IMonthRange | {};
  yearRange?: IYearRange | {};
  dateFormat: DateFormat;
} & Pick<IRangeMonthGridProps, "onDateChange" | "onMonthChange" | "onYearChange">) {
  const [dateRangeValue, setDateRangeValue] = useState<IDateRangeDetail>({
    startDate: null,
    endDate: null,
    hoverSelectedDate: null,
    ...dateRange,
  });
  const isDateSelected = useRef(false);
  const observer = new (OnChangeObserver as any)() as IObserver;

  const triggerPropsCallBack = ({
    startVal,
    endVal,
    gridTableType,
  }: {
    startVal: DateType;
    endVal: DateType;
    gridTableType: ITableType;
  }) => {
    const { start: startValue, end: endValue } = { start: startVal, end: endVal };
    const { start, end } =
      startValue > endValue
        ? { start: endValue, end: startValue }
        : { start: startValue, end: endValue };

    const adjustEndDate = (date: DateType): DateType => {
      switch (gridTableType) {
        case "MONTH":
          return endOfMonth(new Date(date));
        case "YEAR":
          return endOfYear(new Date(date));
        case "DAY":
        default:
          return date;
      }
    };
    const adjustedEndDate = adjustEndDate(end);

    const [startDate, endDate] = [start, adjustedEndDate].map((date) =>
      format(date, dateFormat.formatStr, dateFormat.options as FormatOptions),
    );
    if (onDateChange) {
      onDateChange({ startDate, endDate });
    }
  };

  observer.subscribe([setDateRangeValue, triggerPropsCallBack]);

  const handleDateSelect = (e: MouseEvent, date: DateType, gridTableType: ITableType) => {
    isDateSelected.current = true;
    const { startDate, endDate } = dateRangeValue;
    if (!startDate && !endDate) {
      setDateRangeValue({ ...dateRangeValue, startDate: date });
    } else if (startDate && !endDate) {
      observer.notifyObservers([
        {
          ...dateRangeValue,
          hoverSelectedDate: null,
          endDate: date,
        },
        {
          startVal: dateRangeValue.startDate,
          endVal: date,
          gridTableType,
        },
      ]);
    } else if (startDate && endDate) {
      setDateRangeValue({
        startDate: date,
        endDate: null,
        hoverSelectedDate: null,
      });
    }
  };

  const handleRangeSelect = (SeclectedDateRange: IDateRange | null) => {
    if (SeclectedDateRange) {
      setDateRangeValue({
        ...dateRangeValue,
        startDate: SeclectedDateRange.startDate,
        endDate: SeclectedDateRange.endDate,
      });
      observer.notifyObservers([
        {
          ...dateRangeValue,
          startDate: SeclectedDateRange.startDate,
          endDate: SeclectedDateRange.endDate,
        },
        {
          startVal: SeclectedDateRange.startDate,
          endVal: SeclectedDateRange.endDate,
        },
      ]);
    }
  };

  const handleDateOver = (e: PointerEvent<HTMLTableCellElement>, date: DateType) => {
    if (e.currentTarget) {
      if (dateRangeValue.startDate && !dateRangeValue.endDate) {
        setDateRangeValue({ ...dateRangeValue, hoverSelectedDate: date });
      }
    }
  };
  const throttleOnDateOver = throttle(handleDateOver, 10);

  const memoizedDateOver = useCallback(throttleOnDateOver, [dateRangeValue]);

  return [
    { dateRangeValue },
    {
      handleDateSelect,
      handleDateOver: memoizedDateOver,
      handleRangeSelect,
    },
  ] as const;
}

export default useDateRange;
