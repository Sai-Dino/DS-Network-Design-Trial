# MURV Filter Bar

This package is the MURV Filter Bar component. The Filter Bar component is a collection of various types of select inputs.

## How to Use

Users are expected to provide a filter configuration and a change handler. The filter configuration is an array of objects, where each object corresponds to a type of filter item you want to display. The filter item can be of type 'single-select', 'multi-select', 'single-date-select', or 'range-date-select'.

```tsx
import React from "react";
import { FilterBar } from "@murv/filter-bar";

const filterBarConfig = [
  // Define your filter items here
];

const handleFilterChange = (filterId, selectedValue) => {
  // Handle filter change here
};

const Filters: React.FC = () => {
  return <FilterBar filterConfig={filterBarConfig} onFilterChange={handleFilterChange} />;
};
```

## Filter Item Signature

Each filter item in the configuration should have the following properties:

filterLabel: Label for the filter item.
filterId: This should be the unique key against which user selection will be stored.
filterType: One of 'single-select', 'multi-select', 'single-date-select', or 'range-date-select'.
filterProps: The filter props are the same as you would pass for standalone select . No need to pass label/id/name/value props.

```tsx
const filterItem = {
  filterLabel: "Example Filter",
  filterId: "exampleFilter",
  filterType: "single-select",
  filterProps: {
    // Additional props for the select component
  },
};
```
