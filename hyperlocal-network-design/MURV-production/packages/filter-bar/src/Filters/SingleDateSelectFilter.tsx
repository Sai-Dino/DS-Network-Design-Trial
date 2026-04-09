import React from "react";
import SingleDateSelect from "@murv/single-date-select";
import { ChevronRight } from "@murv/icons";
import { SelectRenderProps } from "../types";
import { Item } from "../styles";

const SingleDateSelectFilter: React.FC<SelectRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;

  const handleChange = (value) => {
    onChange(config.filterId, value);
  };

  const select = (
    <SingleDateSelect
      key={config.filterId}
      {...config.filterProps}
      id={config.filterId}
      label={config.filterLabel}
      date={(filterState[config.filterId] as string) || ""}
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

export default SingleDateSelectFilter;
