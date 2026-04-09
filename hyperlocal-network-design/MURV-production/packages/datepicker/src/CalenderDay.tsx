import React, { MouseEventHandler, PointerEvent, memo } from "react";
import { format, isEqual } from "date-fns";
import { TableRow, TableData } from "./styles";
import {
  CalenderType,
  DateType,
  ICheckDateUtil,
  IConditionHandler,
  IDateRangeDetail,
} from "./types";
import { ConditionHandler, TODAY_DATE, checkDisableDay, isDateSelected } from "./utils";

const CalenderDay = memo(
  ({
    days,
    onClick,
    selectedDate,
    currentSelectedMonth,
    months,
    weekIndex,
    rootIndex,
    calenderType,
    handleMouseUp,
    handleMouseOver,
    dateRange,
    maxDays,
    isDayDisabled,
    min: minDate,
    max: maxDate,
  }: {
    selectedDate: DateType;
    currentSelectedMonth: DateType;
    dateRange: IDateRangeDetail;
    days: Date[];
    onClick: MouseEventHandler;
    months: number[];
    weekIndex: number;
    rootIndex: number;
    calenderType: CalenderType;
    handleMouseUp: (event: PointerEvent<HTMLTableCellElement>, date: DateType) => void;
    handleMouseOver: (event: PointerEvent<HTMLTableCellElement>, date: DateType) => void;
    maxDays?: number;
    isDayDisabled?: (date: DateType) => boolean;
    min?: DateType;
    max?: DateType;
  }) => {
    const { startDate, endDate, hoverSelectedDate } = dateRange || {};

    const isHovered = (startDate && !endDate) as boolean;

    const checkDay: ICheckDateUtil = new (checkDisableDay as any)(
      new Date(currentSelectedMonth.getFullYear(), months[0]),
      new Date(currentSelectedMonth.getFullYear(), months[1] - 1),
      calenderType,
    );

    const checkRangeDays: ICheckDateUtil = new (checkDisableDay as any)(
      startDate || TODAY_DATE,
      endDate || TODAY_DATE,
      calenderType,
    );

    const hoverRangeHelper: ICheckDateUtil = new (checkDisableDay as any)(
      startDate || TODAY_DATE,
      hoverSelectedDate,
      calenderType,
    );

    const checkMinAndMaxDays: ICheckDateUtil = new (checkDisableDay as any)(
      minDate,
      maxDate,
      calenderType,
    );

    const conditionDisabledCheck: IConditionHandler = new (ConditionHandler as any)([
      { callBack: checkMinAndMaxDays.isWithInPartialRange, expected: false },
      { callBack: isDayDisabled, expected: true },
    ]);

    return (
      <TableRow>
        {days.map((day, ind) => (
          <TableData
            key={`key-${weekIndex}-${format(day, "dd/mm/yyyy")}}`}
            data-date-index={ind}
            data-key={`key-${weekIndex}-${format(day, "dd")}`}
            data-date-value={day ? day.toDateString() : ""}
            selected={
              calenderType === "SINGLE"
                ? isDateSelected({ currentSelectedMonth, selectedDate, day })
                : false
            }
            onPointerUp={(e) => handleMouseUp(e, day)}
            onPointerEnter={(e) => {
              e.preventDefault();
              if (startDate && !endDate) {
                handleMouseOver(e, day);
              }
            }}
            onClick={onClick}
            enableHover
            disabled={isDayDisabled && isDayDisabled(day)}
            {...(calenderType === "RANGE" && {
              isRangeStarted:
                (startDate && isEqual(startDate, day)) || hoverRangeHelper.isWithInRange(day),
              isUnderRange: startDate && endDate ? checkRangeDays.isWithInRange(day) : false,
              disabled:
                !checkDay.isWithInSameMonthRange(day, rootIndex) ||
                (isHovered && maxDays && !hoverRangeHelper.isWithInSameSize(day, "DAY", maxDays)) ||
                conditionDisabledCheck.allConditionsValid(day) ||
                (isDayDisabled && isDayDisabled(day)),
            })}
            tabIndex={-1}
          >
            {day ? format(day, "d") : ""}
          </TableData>
        ))}
      </TableRow>
    );
  },
);

export default CalenderDay;
