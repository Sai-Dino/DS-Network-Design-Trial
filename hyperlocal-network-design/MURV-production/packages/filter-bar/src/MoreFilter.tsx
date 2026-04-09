import React, { useCallback, useMemo } from "react";

import { SelectionCard } from "@murv/selection-card";
import DropdownTrigger from "@murv/dropdown-trigger";
import { MoreVert } from "@murv/icons";

import { VisibilityToggleHelper, IVisibilityToggleHelperRef } from "@murv/visibility-toggle";
import { FilterRendererProps } from "./types";
import FilterRenderer from "./FilterRenderer";

const MoreFilter: React.FC<FilterRendererProps> = ({ filterConfig, filterState, onChange }) => {
  const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

  const selectedFilterCount = useMemo(
    () =>
      filterConfig.reduce((acc, filter) => {
        const value = filterState[filter.filterId];
        if (Array.isArray(value) && value.length > 0) {
          return acc + 1;
        }
        if (value && typeof value === "object" && Object.values(value).some((v) => v)) {
          return acc + 1;
        }
        if (value && !Array.isArray(value) && typeof value !== "object") {
          return acc + 1;
        }

        return acc;
      }, 0),
    [filterState, filterConfig],
  );

  const renderTarget = useCallback(
    (triggerProps) => (
      <DropdownTrigger
        primaryText="More Filters"
        badgeText={selectedFilterCount > 0 ? `${selectedFilterCount}` : ""}
        withBorder={false}
        triggerType="filter"
        renderButtonIcon={() => <MoreVert />}
        {...triggerProps}
      />
    ),
    [selectedFilterCount],
  );

  const content = (
    <SelectionCard width="200px" height="auto">
      <FilterRenderer
        filterConfig={filterConfig}
        filterState={filterState}
        onChange={onChange}
        inline={false}
      />
    </SelectionCard>
  );

  return (
    <VisibilityToggleHelper
      offset={{ x: 0, y: 5 }}
      id="more-select"
      action="click"
      closeOnClickOutside
      isChildInteractive
      ref={toggleRef}
      position="bottom-start"
      renderTarget={renderTarget}
    >
      {content}
    </VisibilityToggleHelper>
  );
};

export default MoreFilter;
