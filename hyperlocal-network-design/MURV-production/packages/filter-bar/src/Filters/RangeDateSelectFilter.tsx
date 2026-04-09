import React from "react";
import RangeDateSelect from "@murv/range-date-select";
import { parse } from "date-fns";
import { ChevronRight } from "@murv/icons";
import { IDateRangeState, RangeDateSelectFilterProps, SelectRenderProps } from "../types";
import { Item } from "../styles";

const RangeDateSelectFilter: React.FC<SelectRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;

  const rangeProps = config.filterProps as RangeDateSelectFilterProps;

  const dateFormat = rangeProps?.dateOutputFormat?.formatStr || "";

  /* selected date range state as stored in filterState */
  const internalState = filterState[config.filterId] as IDateRangeState;

  const today = new Date();

  /* Date range picker expects Date type start annd end date, hence parsing is required */
  const parsedDates = internalState
    ? {
        startDate: parse(internalState.startDate as string, dateFormat, today),
        endDate: parse(internalState.endDate as string, dateFormat, today),
      }
    : { startDate: null, endDate: null };

  const handleChange = (value: IDateRangeState) => {
    onChange(config.filterId, value);
  };

  const select = (
    <RangeDateSelect
      key={config.filterId}
      {...rangeProps}
      label={config.filterLabel}
      dateRange={parsedDates}
      onDateChange={handleChange}
      withBorder={false}
      triggerType="filter"
      orientation={inline ? "vertical" : "horizontal"}
      buttonWidth={inline ? undefined : "100%"}
      renderButtonIcon={inline ? undefined : () => <ChevronRight />}
    />
  );

  return inline ? (
    <Item inline last={last}>
      {select}
    </Item>
  ) : (
    select
  );
};

export default RangeDateSelectFilter;
