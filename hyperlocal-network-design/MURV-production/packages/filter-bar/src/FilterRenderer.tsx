// FilterRenderer.tsx
import React from "react";

import { FilterRendererProps } from "./types";
import {
  MultiSelectFilter,
  SingleSelectFilter,
  SingleDateSelectFilter,
  TextFilter,
} from "./Filters";
import { DropdownContainer, InlineContainer } from "./styles";
import RangeDateSelectFilter from "./Filters/RangeDateSelectFilter";
import CustomDropdownFilter from "./Filters/CustomDropdownFilter";

const FilterRenderer: React.FC<FilterRendererProps> = ({
  filterConfig,
  filterState,
  onChange,
  inline,
  last,
}) => {
  const Container = inline ? InlineContainer : DropdownContainer;

  return (
    <Container>
      {filterConfig.map((filter, index) => {
        switch (filter.filterType) {
          case "single-select":
            return (
              <SingleSelectFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );

          case "multi-select":
            return (
              <MultiSelectFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );

          case "single-date-select":
            return (
              <SingleDateSelectFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );
          case "range-date-select":
            return (
              <RangeDateSelectFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );
          case "custom-dropdown":
            return (
              <CustomDropdownFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );
          case "text-filter":
            return (
              <TextFilter
                config={filter}
                onChange={onChange}
                filterState={filterState}
                inline={inline}
                last={last && filterConfig.length - 1 === index}
                key={filter.filterId}
              />
            );

          default:
            return null;
        }
      })}
    </Container>
  );
};

export default FilterRenderer;
