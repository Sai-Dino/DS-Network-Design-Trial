import React, { MouseEvent, useEffect, useState } from "react";
import { isValid, format, FormatOptions } from "date-fns";
import { RangeMonthGrid, SingleMonthGrid } from "./CalenderGrid";
import { DatePickerContainer } from "./styles";
import { TODAY_DATE, formatDateFromInput } from "./utils";
import { IDateRangePickerProps, ISingleDatePickerProps } from "./types";

const SingleDatePicker = ({
  testId,
  date,
  onDateChange,
  onTimeChange,
  timeValue,
  className,
  ...props
}: ISingleDatePickerProps) => {
  const [selectedDate, setDate] = useState(
    formatDateFromInput(isValid(new Date(date)) ? date : TODAY_DATE),
  );
  const hanldeDateChange = (e: MouseEvent) => {
    const value = e.currentTarget.getAttribute("data-date-value");

    if (value?.length) {
      const newDate = new Date(value);
      setDate(newDate);
      if (onDateChange) {
        onDateChange(
          format(
            newDate,
            props.dateOutputFormat.formatStr,
            props.dateOutputFormat.options as FormatOptions,
          ),
          e,
        );
      }
    }
  };

  useEffect(() => {
    if (date && isValid(new Date(date))) {
      setDate(formatDateFromInput(date));
    }
  }, [date]);

  return (
    <DatePickerContainer data-testid={testId} className={className}>
      <SingleMonthGrid
        onDateClick={hanldeDateChange}
        selectedDate={selectedDate}
        onTimeChange={onTimeChange}
        timeValue={timeValue}
        {...props}
      />
    </DatePickerContainer>
  );
};

const DateRangePicker = ({
  testId,
  onTimeChange,
  startTime,
  endTime,
  className,
  ...props
}: IDateRangePickerProps) => (
  <DatePickerContainer data-testid={testId} type="RANGE" className={className}>
    <RangeMonthGrid
      onTimeChange={onTimeChange}
      startTime={startTime}
      endTime={endTime}
      {...props}
    />
  </DatePickerContainer>
);

export const DatePicker = { Single: SingleDatePicker, Range: DateRangePicker };
