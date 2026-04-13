import React from "react";
import { ButtonProps } from "@murv/button";
import { ButtonGroupProps } from "@murv/button-group";
import { ISearchProps } from "@murv/search";
import { SearchFeedbackProps } from "@murv/search-feedback";
import { FilterConfig } from "@murv/filter-bar";
import { ExpandMore } from "@murv/icons";
import DrilldownBar from "./src/DrilldownBar";

export interface IDrilldownBarRendererProps {
  buttonProps?: ButtonProps;
  searchProps: ISearchProps;
  searchFeedbackProps: SearchFeedbackProps;
  filterBarConfig?: FilterConfig[];
  onFilterChange?: (filters: any) => void;
  resetButtonProps?: ButtonProps;
  buttonGroupProps?: ButtonGroupProps;
}

export const DrilldownBarRenderer: React.FC<IDrilldownBarRendererProps> = (
  props: IDrilldownBarRendererProps,
) => {
  const {
    searchProps,
    filterBarConfig,
    onFilterChange,
    searchFeedbackProps,
    resetButtonProps,
    buttonProps,
    buttonGroupProps,
  } = props;

  const FilterBarComponent = DrilldownBar.FilterBar;
  const SearchFeedbackComponent = DrilldownBar.SearchFeedback;
  const ButtonComponent = DrilldownBar.Button;
  const ButtonGroupComponent = DrilldownBar.ButtonGroup;

  return (
    <DrilldownBar>
      <DrilldownBar.Line>
        <DrilldownBar.Search {...searchProps} />
        {filterBarConfig && FilterBarComponent && (
          <FilterBarComponent filterConfig={filterBarConfig} onFilterChange={onFilterChange} />
        )}
      </DrilldownBar.Line>
      <DrilldownBar.Line>
        {SearchFeedbackComponent && <SearchFeedbackComponent {...searchFeedbackProps} />}
        {resetButtonProps && ButtonComponent && <ButtonComponent {...resetButtonProps} />}
        {ButtonComponent && buttonProps && <ButtonComponent {...buttonProps} />}
        {ButtonGroupComponent && buttonGroupProps?.buttons && (
          <ButtonGroupComponent buttons={buttonGroupProps.buttons} />
        )}
      </DrilldownBar.Line>
    </DrilldownBar>
  );
};

const mockOnSearch = (query: String) => {
  alert(`Pass onSearch function to search for query - ${query}`); // eslint-disable-line no-alert
};

export const StoryExampleProps: { [key: string]: IDrilldownBarRendererProps } = {
  exampleOne: {
    buttonProps: {
      children: "Actions",
      buttonType: "secondary",
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
    },
    searchFeedbackProps: {
      totalItemCount: 199,
      foundItemCount: 27,
      foundItems: ["XYZ"],
      notFoundItemCount: 0,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleTwo: {
    buttonProps: {
      buttonType: "secondary",
      children: "Actions",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
    },
    searchFeedbackProps: {
      totalItemCount: 199,
      foundItemCount: 27,
      foundItems: ["XYZ"],
      notFoundItemCount: 0,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleThree: {
    buttonProps: {
      buttonType: "secondary",
      children: "Actions",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
      disabled: true,
    },
    searchFeedbackProps: {
      totalItemCount: 199,
      foundItemCount: 0,
      foundItems: ["XYZ"],
      notFoundItemCount: 23,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleFour: {
    buttonProps: {
      buttonType: "secondary",
      children: "Actions",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
      disabled: true,
    },
    searchFeedbackProps: {
      totalItemCount: 199,
      foundItemCount: 1,
      foundItems: ["XYZ"],
      notFoundItemCount: 0,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleFive: {
    buttonProps: {
      buttonType: "secondary",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
    },
    searchFeedbackProps: {
      totalItemCount: 19,
      foundItemCount: 4,
      foundItems: ["XYZ"],
      notFoundItemCount: 0,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleSix: {
    buttonProps: {
      buttonType: "secondary",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
      disabled: true,
    },
    searchFeedbackProps: {
      totalItemCount: 19,
      foundItemCount: 0,
      foundItems: ["XYZ"],
      notFoundItemCount: 2,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleSeven: {
    buttonProps: {
      buttonType: "secondary",
      SuffixIcon: ExpandMore,
      onClick: () => {},
    },
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search parameter",
      onSearch: (query) => mockOnSearch(query),
      disabled: true,
    },
    searchFeedbackProps: {
      totalItemCount: 199,
      foundItemCount: 1,
      foundItems: ["XYZ"],
      notFoundItemCount: 0,
      notFoundItems: [],
      actionLabel: "Copy",
    },
  },
  exampleEight: {
    searchProps: {
      id: "drilldown-bar-search",
      placeholder: "Search Parameter",
      onSearch: (query) => mockOnSearch(query),
    },
    searchFeedbackProps: {
      totalItemCount: 450,
      foundItemCount: 0,
      foundItems: [],
      notFoundItemCount: 0,
      notFoundItems: [],
      displayMode: "total",
      showActions: false,
    },
    filterBarConfig: [
      {
        filterId: "filter1",
        filterLabel: "Filter 1",
        filterType: "single-select",
        filterProps: {
          options: [
            { label: "Option 1", value: "opt1" },
            { label: "Option 2", value: "opt2" },
            { label: "Option 3", value: "opt3" },
          ],
        },
      },
      {
        filterId: "filter2",
        filterLabel: "Filter 2",
        filterType: "single-select",
        filterProps: {
          options: [
            { label: "Option A", value: "optA" },
            { label: "Option B", value: "optB" },
            { label: "Option C", value: "optC" },
          ],
        },
      },
      {
        filterId: "filter3",
        filterLabel: "Filter 3",
        filterType: "single-select",
        filterProps: {
          options: [
            { label: "Choice 1", value: "ch1" },
            { label: "Choice 2", value: "ch2" },
            { label: "Choice 3", value: "ch3" },
          ],
        },
      },
      {
        filterId: "filter4",
        filterLabel: "Filter 4",
        filterType: "single-select",
        filterProps: {
          options: [
            { label: "Item 1", value: "item1" },
            { label: "Item 2", value: "item2" },
          ],
        },
      },
    ],
    resetButtonProps: {
      buttonType: "tertiary",
      children: "Reset",
      onClick: () => {},
    },
    buttonProps: {
      buttonType: "secondary",
      children: "Apply",
      onClick: () => {},
    },
    onFilterChange: (filters: any) => {
      // eslint-disable-next-line no-console
      console.log("Filter changed:", filters);
    },
  },
};
