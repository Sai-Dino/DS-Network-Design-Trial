import React from "react";
import MultiSelect from "@murv/multi-select";
import { ChevronRight } from "@murv/icons";
import { SelectRenderProps } from "../types";
import { Item } from "../styles";

const MultiSelectFilter: React.FC<SelectRenderProps> = (props) => {
  const { config, filterState, onChange, inline, last } = props;
  const handleChange = (value) => {
    onChange(config.filterId, value);
  };

  const select = (
    <MultiSelect
      key={config.filterId}
      {...config.filterProps}
      name={config.filterLabel}
      selected={(filterState[config.filterId] as string[]) || []}
      onSelect={handleChange}
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

export default MultiSelectFilter;
