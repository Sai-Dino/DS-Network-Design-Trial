import React from "react";
import SingleSelect from "@murv/single-select";
import { ChevronRight } from "@murv/icons";
import { SelectRenderProps } from "../types";
import { Item } from "../styles";

const SingleSelectFilter: React.FC<SelectRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;

  const handleChange = (value) => {
    onChange(config.filterId, value);
  };

  const select = (
    <SingleSelect
      key={config.filterId}
      {...config.filterProps}
      name={config.filterId}
      id={config.filterId}
      label={config.filterLabel}
      value={(filterState[config.filterId] as string) || ""}
      onChange={handleChange}
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

export default SingleSelectFilter;
