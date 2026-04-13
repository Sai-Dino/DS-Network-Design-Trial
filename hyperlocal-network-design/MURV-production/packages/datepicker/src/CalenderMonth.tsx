import React, { PointerEvent, memo } from "react";
import { format, isEqual } from "date-fns";
import { TableRow, TableData, Quater } from "./styles";
import {
  CalenderType,
  DateType,
  ICheckDateUtil,
  IConditionHandler,
  IDateRangeDetail,
} from "./types";
import { ConditionHandler, checkDisableDay } from "./utils";

const CalenderMonth = memo(
  ({
    months,
    onClick,
    quarterIndex,
    activeDate,
    monthRange,
    handleMouseOver,
    calenderType,
    maxMonths,
    isMonthDisabled,
    min: minDate,
    max: maxDate,
  }: {
    months: DateType[];
    onClick: (e: React.MouseEvent<HTMLTableCellElement>, month: DateType) => void;
    quarterIndex: number;
    activeDate: DateType;
    monthRange: IDateRangeDetail;
    handleMouseOver: (event: PointerEvent<HTMLTableCellElement>, date: DateType) => void;
    calenderType: CalenderType;
    maxMonths?: number;
    isMonthDisabled?: (date: DateType) => boolean;
    min?: DateType;
    max?: DateType;
  }) => {
    const { startDate, endDate, hoverSelectedDate } = monthRange;

    const selectedMonthsHelper: ICheckDateUtil = new (checkDisableDay as any)(startDate, endDate);

    const hoverMonthsHelper: ICheckDateUtil = new (checkDisableDay as any)(
      startDate,
      hoverSelectedDate,
    );

    const isHovered = (startDate && !endDate) as boolean;

    const checkMinAndMaxDays: ICheckDateUtil = new (checkDisableDay as any)(
      minDate,
      maxDate,
      calenderType,
    );

    const conditionCheck: IConditionHandler = new (ConditionHandler as any)([
      { callBack: minDate && maxDate && checkMinAndMaxDays.isWithInRange, expected: false },
      { callBack: isMonthDisabled, expected: true },
    ]);

    return (
      <TableRow columns={4}>
        <TableData>
          <Quater>{`Q${quarterIndex + 1}`}</Quater>
        </TableData>
        {months.map((_month, ind) => {
          const month = new Date(_month.getFullYear(), _month.getMonth(), 1);
          return (
            <TableData
              key={`key-${month}`}
              onClick={(e) => onClick(e, month)}
              data-month-index={ind}
              data-month-value={month}
              selected={
                calenderType === "SINGLE" &&
                isEqual(activeDate.getFullYear(), month.getFullYear()) &&
                isEqual(activeDate.getMonth(), month.getMonth())
              }
              onPointerEnter={(e) => {
                e.preventDefault();
                if (startDate && !endDate) {
                  handleMouseOver(e, month);
                }
              }}
              enableHover
              disabled={isMonthDisabled && isMonthDisabled(month)}
              {...(calenderType === "RANGE" && {
                disabled:
                  (isHovered && !hoverMonthsHelper.isWithInSameSize(month, "MONTH", maxMonths)) ||
                  conditionCheck.allConditionsValid(month) ||
                  (isMonthDisabled && isMonthDisabled(month)),
                isUnderRange: selectedMonthsHelper.isMonthsWithInRange(month),
                isRangeStarted: hoverMonthsHelper.isHoverMonthsWithInRange(month),
              })}
            >
              {format(month, "MMM")}
            </TableData>
          );
        })}
      </TableRow>
    );
  },
);

export default CalenderMonth;
