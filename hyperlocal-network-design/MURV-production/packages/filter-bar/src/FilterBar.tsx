import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@murv/button";
import { PageInfo } from "@murv/icons";
import { DummyIcon, FilterBarContainer, Item } from "./styles";
import { FilterBarProps } from "./types";
import FilterRenderer from "./FilterRenderer";
import MoreFilter from "./MoreFilter";

function sanitizeVariable(input) {
  // Check if the input is null, undefined, an empty string, or not an object
  if (input === null || typeof input !== "object" || Array.isArray(input) || input === "") {
    return {};
  }

  // Return the input if it's an object
  return input;
}

function isEmptyObject(obj) {
  return obj && typeof obj === "object" && !Array.isArray(obj) && Object.keys(obj).length === 0;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterConfig,
  filters,
  onFilterChange,
  onFilterApply,
  enableApplyResetButtons,
  resetSelectedFilterState,
}) => {
  const [filterState, setFilterState] = useState<Record<string, string | string[]>>({});
  const [appliedFilterState, setAppliedFilterState] = useState<Record<string, any>>({});
  const [isApplied, setIsApplied] = useState<boolean>(false);

  // this will reset the filters which are not applied but selected
  // note: this will not reset the filters which are applied
  const handleResetFilterState = () => {
    setFilterState({});
  };
  useEffect(() => {
    /* In case of undefined and null initialise it to an object */
    const sanitizedFilters = sanitizeVariable(filters || {});
    setFilterState(sanitizedFilters);
    setAppliedFilterState(sanitizedFilters);
    /* When the filters props is an empty object the 'Apply' button is displayed and it is disabled,
    rest all cases Reset button is displayed and enabled */
    setIsApplied(!isEmptyObject(sanitizedFilters));
  }, [filters]);

  useEffect(() => {
    setAppliedFilterState(filterState);
  }, [filterConfig]);

  // Expose the reset filter state function through the prop
  useEffect(() => {
    if (resetSelectedFilterState) {
      resetSelectedFilterState(handleResetFilterState);
    }
  }, [resetSelectedFilterState]);

  const onChange = (id: any, value: any) => {
    setFilterState((prevState) => {
      const newState = { ...prevState };
      let updatedFilter = { [id]: value };

      if (prevState[id] === value) {
        delete newState[id];
        updatedFilter = {};
      } else {
        newState[id] = value;
      }

      setIsApplied(false);

      if (onFilterChange) {
        onFilterChange({ currentValue: { ...updatedFilter }, filterValues: { ...newState } });
      }

      return newState;
    });
  };

  const handleApply = () => {
    setIsApplied(true);
    setAppliedFilterState(filterState);
    if (onFilterApply) onFilterApply({ filterValues: filterState });
  };

  const handleReset = () => {
    setFilterState({});
    setAppliedFilterState({});
    setIsApplied(false);
    if (onFilterChange) onFilterChange({});
    if (onFilterApply) onFilterApply({ filterValues: {} });
  };

  const topFilters = filterConfig.slice(0, 3);
  const moreFilters = filterConfig.slice(3);

  const hasChanges = useMemo(
    () => JSON.stringify(filterState) !== JSON.stringify(appliedFilterState),
    [filterState, appliedFilterState],
  );

  return (
    <FilterBarContainer>
      <Item first inline>
        <DummyIcon>
          <PageInfo />
        </DummyIcon>
      </Item>
      <FilterRenderer
        filterConfig={topFilters}
        onChange={onChange}
        filterState={filterState}
        last={!(enableApplyResetButtons || onFilterApply) && !moreFilters.length}
        inline
      />
      {moreFilters.length ? (
        <Item last={!(enableApplyResetButtons || onFilterApply)} inline>
          <MoreFilter filterConfig={moreFilters} onChange={onChange} filterState={filterState} />
        </Item>
      ) : null}
      {(enableApplyResetButtons || onFilterApply) && (
        <Item last inline>
          <Button
            onClick={isApplied ? handleReset : handleApply}
            buttonType="tertiary"
            disabled={!isApplied && !hasChanges}
          >
            {isApplied ? "Reset" : "Apply"}
          </Button>
        </Item>
      )}
    </FilterBarContainer>
  );
};
