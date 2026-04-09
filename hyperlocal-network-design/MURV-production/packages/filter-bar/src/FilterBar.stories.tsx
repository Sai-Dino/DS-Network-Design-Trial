import React, { useState } from "react";
import type { StoryObj, Meta } from "@storybook/react";
import { MoreVert } from "@murv/icons";
import {
  FilterBar,
  FilterConfig,
  MultiSelectFilterProps,
  SingleSelectFilterProps,
  RangeDateSelectFilterProps,
  FilterType,
  TextFilterProps,
} from ".";

// ─── Best practice for large node lists ──────────────────────────────────────
// The `nodes` array passed to a multi-select filter MUST be a stable reference
// (defined outside any component or wrapped in useMemo). The checkbox-tree
// component uses reference equality on `nodes` to decide when to reset and
// re-flatten its internal model. An unstable reference (e.g. defined inline in
// JSX or recreated on every render) causes a full model reset on every render,
// defeating the virtualisation optimisation and causing sluggish behaviour.
//
//   ✅ Do:   const filterConfig = useMemo(() => [...], [dependency]);
//   ✅ Do:   const filterConfig = [...]; // module-level constant
//   ❌ Don't: <FilterBar filterConfig={[{ filterProps: { nodes: items.map(fn) } }]} />
// ─────────────────────────────────────────────────────────────────────────────

// 3000 flat items — module-level constant so the reference is stable.
const largeNodes: MultiSelectFilterProps["nodes"] = Array.from({ length: 3000 }, (_, i) => ({
  id: `item-${i}`,
  label: `Item ${i + 1}`,
  value: `item_${i + 1}`,
}));

// filterConfig is also module-level for the same reason.
const largeMultiSelectFilterConfig: FilterConfig[] = [
  {
    filterId: "items",
    filterLabel: "Items",
    filterType: "multi-select" as FilterType,
    filterProps: {
      nodes: largeNodes,
    } as MultiSelectFilterProps,
  },
  {
    filterId: "location",
    filterLabel: "Location",
    filterType: "single-select" as FilterType,
    filterProps: {
      options: [
        { label: "New York", value: "ny" },
        { label: "Los Angeles", value: "la" },
        { label: "Chicago", value: "chi" },
      ],
    } as SingleSelectFilterProps,
  },
  {
    filterId: "status",
    filterLabel: "Status",
    filterType: "single-select" as FilterType,
    filterProps: {
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    } as SingleSelectFilterProps,
  },
];

const meta = {
  title: "Components/FilterBar",
  component: FilterBar,
  tags: ["autodocs"],
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof FilterBar>;

const CustomSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => (
  <div style={{ padding: "16px", minWidth: "200px" }}>
    <select
      value={value || ""}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      style={{ width: "100%" }}
    >
      <option value="">Select an option...</option>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </select>
  </div>
);

const filterConfig1: FilterConfig[] = [
  {
    filterId: "fsn",
    filterLabel: "FSN",
    filterType: "text-filter" as FilterType,
    filterProps: {
      placeholder: "Enter FSN...",
      maxLength: 50,
      helpText: "Enter search text",
    } as TextFilterProps,
  },
  {
    filterId: "location",
    filterLabel: "Location",
    filterType: "single-select" as FilterType,
    filterProps: {
      options: [
        { label: "New York", value: "ny" },
        { label: "Los Angeles", value: "la" },
        { label: "Chicago", value: "chi" },
      ],
    } as SingleSelectFilterProps,
  },
  {
    filterId: "customFilter",
    filterType: "custom-dropdown" as FilterType,
    filterLabel: "Custom Filter",
    filterProps: {
      showBadge: true,
    } as any,
    children: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <CustomSelect value={value} onChange={onChange} />
    ),
  } as any,
  {
    filterId: "sku",
    filterLabel: "SKU",
    filterType: "text-filter" as FilterType,
    filterProps: {
      placeholder: "Enter SKU...",
      maxLength: 30,
      helpText: "Enter SKU to filter",
    } as TextFilterProps,
  },
  {
    filterId: "category",
    filterLabel: "Category",
    filterType: "single-select" as FilterType,
    filterProps: {
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Furniture", value: "furniture" },
        { label: "Clothing", value: "clothing" },
      ],
    } as SingleSelectFilterProps,
  },
  {
    filterId: "status",
    filterLabel: "Status",
    filterType: "multi-select" as FilterType,
    filterProps: {
      nodes: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Pending", value: "pending" },
      ],
    } as MultiSelectFilterProps,
  },
  {
    filterId: "date_added",
    filterLabel: "Date Added",
    filterType: "single-date-select" as FilterType,
    filterProps: {
      dateOutputFormat: {
        formatStr: "MM-dd-yyyy",
      },
    } as RangeDateSelectFilterProps,
  },
  {
    filterId: "date_range",
    filterLabel: "Date Range",
    filterType: "range-date-select" as FilterType,
    filterProps: {
      dateOutputFormat: {
        formatStr: "MM-dd-yyyy",
      },
      activeCalenderType: "DAY",
    } as RangeDateSelectFilterProps,
  },
  {
    filterId: "customFilter",
    filterType: "custom-dropdown" as FilterType,
    filterLabel: "Custom Filter",
    filterProps: {
      showBadge: false,
      prefixButtonIcon: () => <MoreVert />,
    } as any,
    children: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
      <CustomSelect value={value} onChange={onChange} />
    ),
  } as any,
];

const filterConfig2 = JSON.parse(JSON.stringify(filterConfig1)).map((config: any) => {
  // eslint-disable-next-line no-param-reassign
  config.filterId += "_2";
  // eslint-disable-next-line no-param-reassign
  config.filterLabel += " Config 2";
  return config;
});

const filterConfig3 = JSON.parse(JSON.stringify(filterConfig1)).map((config: any) => {
  // eslint-disable-next-line no-param-reassign
  config.filterId += "_3";
  // eslint-disable-next-line no-param-reassign
  config.filterLabel += " Config 3";
  return config;
});

const filterConfig4 = JSON.parse(JSON.stringify(filterConfig1)).map((config: any) => {
  // eslint-disable-next-line no-param-reassign
  config.filterId += "_4";
  // eslint-disable-next-line no-param-reassign
  config.filterLabel += " Config 4";
  return config;
});

const filterConfig5 = JSON.parse(JSON.stringify(filterConfig1)).map((config: any) => {
  // eslint-disable-next-line no-param-reassign
  config.filterId += "_5";

  // eslint-disable-next-line no-param-reassign
  config.filterLabel += " Config 5";
  return config;
});

export const FilterBarBasic: Story = {
  render() {
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
    };
    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };
    return (
      <FilterBar
        filterConfig={filterConfig1}
        onFilterChange={handleFilterChange}
        onFilterApply={handleApplyChange}
      />
    );
  },
  args: {},
};

export const FilterBarWithDefaultSelected: Story = {
  render() {
    const defaultFilters = { category_2: "Electronics", location_2: "Los Angeles" };
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
    };
    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };
    return (
      <FilterBar
        filterConfig={filterConfig2}
        filters={defaultFilters}
        onFilterChange={handleFilterChange}
        onFilterApply={handleApplyChange}
      />
    );
  },
  args: {},
};
export const FilterBarWithResetSelectedFilterState: Story = {
  render() {
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
    };
    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };

    let resetHandler: (() => void) | null = null;

    const handleResetSelectedFilterState = (resetFn: () => void) => {
      console.log("Reset Selected Filter State");
      resetHandler = resetFn;
    };

    const handleResetClick = () => {
      if (resetHandler) {
        resetHandler();
      }
    };

    return (
      <>
        <FilterBar
          filterConfig={filterConfig1}
          onFilterChange={handleFilterChange}
          onFilterApply={handleApplyChange}
          resetSelectedFilterState={handleResetSelectedFilterState}
        />
        <button type="button" onClick={handleResetClick}>
          Clear Selected Filters
        </button>
      </>
    );
  },
  args: {},
};
export const FilterBarControlled: Story = {
  render() {
    const [filterState, setFilterState] = useState({});
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
      setFilterState(filters?.filterValues);
    };
    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };
    const handleReset = () => {
      setFilterState({});
    };

    return (
      <>
        <button type="button" onClick={handleReset}>
          Reset to default
        </button>
        <FilterBar
          filters={filterState}
          filterConfig={filterConfig3}
          onFilterChange={handleFilterChange}
          onFilterApply={handleApplyChange}
        />
      </>
    );
  },
  args: {},
};

export const FilterBarWithoutApply: Story = {
  render() {
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
    };

    return <FilterBar filterConfig={filterConfig4} onFilterChange={handleFilterChange} />;
  },
  args: {},
};

export const FilterBarEnableApplyUsingOnchange: Story = {
  render() {
    const [isApply, setIsApply] = useState(false);

    const handleFilterChange = (filters: any) => {
      setIsApply(true);
      console.log("On Filter Change", filters);
    };

    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };

    return (
      <FilterBar
        filterConfig={filterConfig5}
        onFilterChange={handleFilterChange}
        enableApplyResetButtons={isApply}
        {...(isApply && { onFilterApply: handleApplyChange })}
      />
    );
  },
  args: {},
};

export const FilterBarWithoutMore: Story = {
  render() {
    const [isApply, setIsApply] = useState(false);

    const handleFilterChange = (filters: any) => {
      setIsApply(true);
      console.log("On Filter Change", filters);
    };

    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };

    return (
      <FilterBar
        filterConfig={[
          {
            filterId: "location",
            filterLabel: "Location",
            filterType: "single-select" as FilterType,
            filterProps: {
              options: [
                { label: "New York", value: "ny" },
                { label: "Los Angeles", value: "la" },
                { label: "Chicago", value: "chi" },
              ],
              prefixButtonIcon: () => <MoreVert />,
            } as SingleSelectFilterProps,
          },
          {
            filterId: "category",
            filterLabel: "Category",
            filterType: "single-select" as FilterType,
            filterProps: {
              options: [
                { label: "Electronics", value: "electronics" },
                { label: "Furniture", value: "furniture" },
                { label: "Clothing", value: "clothing" },
              ],
            } as SingleSelectFilterProps,
          },
        ]}
        onFilterChange={handleFilterChange}
        enableApplyResetButtons={isApply}
        {...(isApply && { onFilterApply: handleApplyChange })}
      />
    );
  },
  args: {},
};

export const FilterBarWithTextFilter: Story = {
  render() {
    const handleFilterChange = (filters: any) => {
      console.log("On Filter Change", filters);
    };
    const handleApplyChange = (applyfilters: any) => {
      console.log("On Apply Change", applyfilters);
    };
    return (
      <FilterBar
        filterConfig={[
          {
            filterId: "fsn",
            filterLabel: "FSN",
            filterType: "text-filter" as FilterType,
            filterProps: {
              placeholder: "FSN...",
              maxLength: 50,
              helpText: "Enter search text",
            } as TextFilterProps,
          },
          {
            filterId: "advanced_search",
            filterLabel: "Advanced Search",
            filterType: "text-filter" as FilterType,
            filterProps: {
              placeholder: "Advanced search...",
              maxLength: 100,
              helpText: "Enter advanced search criteria",
            } as TextFilterProps,
          },
        ]}
        onFilterChange={handleFilterChange}
        onFilterApply={handleApplyChange}
      />
    );
  },
  args: {},
};

export const FilterBarWithLargeMultiSelect: Story = {
  render() {
    const [filters, setFilters] = useState({});

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            padding: "12px 16px",
            borderLeft: "4px solid #f0a500",
            backgroundColor: "#fffbf0",
            borderRadius: "4px",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#333",
          }}
        >
          <strong>⚠ Best practice — stable node references</strong>
          <br />
          The <code>nodes</code> array passed to a multi-select filter must be a{" "}
          <strong>stable reference</strong>. The checkbox-tree uses reference equality on{" "}
          <code>nodes</code> to decide when to reset its internal model. An unstable reference
          causes a full model reset on every render, defeating virtualisation.
          <br />
          <br />
          <span style={{ color: "green" }}>✅ Do:</span>
          <br />
          <code>{"const filterConfig = useMemo(() => [...], [dep]); // inside component"}</code>
          <br />
          <code>const filterConfig = [...]; // module-level constant</code>
          <br />
          <br />
          <span style={{ color: "red" }}>❌ Don&apos;t:</span>
          <br />
          <code>{"<FilterBar filterConfig={[{ filterProps: { nodes: items.map(fn) } }]} />"}</code>
        </div>
        <FilterBar
          filterConfig={largeMultiSelectFilterConfig}
          filters={filters}
          onFilterChange={({ filterValues }) => setFilters(filterValues)}
        />
      </div>
    );
  },
  args: {},
};
