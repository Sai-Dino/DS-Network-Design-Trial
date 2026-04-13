import React, { PointerEvent } from "react";
import { format, isEqual } from "date-fns";
import { TableRow, TableData } from "./styles";
import {
  CalenderType,
  DateType,
  ICheckDateUtil,
  IConditionHandler,
  IDateRangeDetail,
} from "./types";
import { ConditionHandler, checkDisableDay } from "./utils";

const CalenderYear = ({
  years,
  onClick,
  activeYear,
  yearRange,
  handleMouseOver,
  calenderType,
  maxYears,
  isYearDisabled,
  min: minDate,
  max: maxDate,
}: {
  years: DateType[];
  onClick: (e: React.MouseEvent<HTMLTableCellElement>, year: DateType) => void;
  activeYear: number;
  yearRange: IDateRangeDetail;
  handleMouseOver: (event: PointerEvent<HTMLTableCellElement>, date: DateType) => void;
  calenderType: CalenderType;
  maxYears?: number;
  isYearDisabled?: (date: DateType) => boolean;
  min?: DateType;
  max?: DateType;
}) => {
  const { startDate, endDate, hoverSelectedDate } = yearRange;

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
    { callBack: isYearDisabled, expected: true },
  ]);

  return (
    <TableRow columns={4}>
      {years.map((_year, ind) => {
        const year = new Date(_year.getFullYear(), 0, 1);
        return (
          <TableData
            key={`key-${year}`}
            onClick={(e) => onClick(e, year)}
            data-month-index={ind}
            data-year-value={year}
            selected={calenderType === "SINGLE" && isEqual(activeYear, year.getFullYear())}
            onPointerEnter={(e) => {
              e.preventDefault();
              if (startDate && !endDate) {
                handleMouseOver(e, year);
              }
            }}
            enableHover
            disabled={isYearDisabled && isYearDisabled(year)}
            {...(calenderType === "RANGE" && {
              isUnderRange: selectedMonthsHelper.isMonthsWithInRange(year),
              isRangeStarted: hoverMonthsHelper.isHoverMonthsWithInRange(year),
              disabled:
                (isHovered && !hoverMonthsHelper.isWithInSameSize(year, "YEAR", maxYears)) ||
                conditionCheck.allConditionsValid(year) ||
                (isYearDisabled && isYearDisabled(year)),
            })}
          >
            {format(year, "yyy")}
          </TableData>
        );
      })}
    </TableRow>
  );
};

export default CalenderYear;
