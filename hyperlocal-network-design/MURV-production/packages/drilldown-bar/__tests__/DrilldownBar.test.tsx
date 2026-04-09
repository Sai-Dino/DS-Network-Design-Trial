import React from "react";
import "@testing-library/jest-dom";
import { ExpandMore } from "@murv/icons";
import { ButtonProps } from "@murv/button";
import { ISearchProps } from "@murv/search";
import { SearchFeedbackProps } from "@murv/search-feedback";
import { render } from "test-utils";
import { DrilldownBar } from "../src";

const mockOnSearch = (query: String) => {
  alert(`Pass onSearch function to search for query - ${query}`); // eslint-disable-line no-alert
};

describe("DrilldownBar Component testing", () => {
  const mockButtonProps: ButtonProps = {
    buttonType: "secondary",
    children: "Actions",
    SuffixIcon: ExpandMore,
    onClick: () => {},
  };

  const mockSearchProps: ISearchProps = {
    id: "drilldown-bar-search",
    placeholder: "Search parameter",
    onSearch: (query) => mockOnSearch(query),
  };

  const mockSearchFeedbackProps: SearchFeedbackProps = {
    totalItemCount: 27021999,
    foundItemCount: 2024,
    foundItems: ["XYZ"],
    notFoundItemCount: 12,
    notFoundItems: [],
    actionLabel: "Copy",
  };
  it("renders allowed children and filters invalid children (no snapshot)", () => {
    const { getByTestId, getByPlaceholderText, getByText, queryByText } = render(
      <DrilldownBar id="drill-1" dataTestId="drilldown-test">
        <DrilldownBar.Line>
          <DrilldownBar.Search {...mockSearchProps} />
        </DrilldownBar.Line>
        <DrilldownBar.Line>
          <DrilldownBar.SearchFeedback {...mockSearchFeedbackProps} />
          <DrilldownBar.Button {...mockButtonProps} />
          <div>Invalid</div>
        </DrilldownBar.Line>
      </DrilldownBar>,
    );

    // root wrapper present
    expect(getByTestId("drilldown-test")).toBeInTheDocument();
    // Search is rendered (by placeholder)
    expect(getByPlaceholderText("Search parameter")).toBeInTheDocument();
    // Button child content
    expect(getByText("Actions")).toBeInTheDocument();
    // SearchFeedback renders action and reset buttons for these counts
    expect(getByText("Copy")).toBeInTheDocument();
    expect(getByText("Reset")).toBeInTheDocument();
    // Invalid arbitrary child is filtered out by allowed types
    expect(queryByText("Invalid")).toBeNull();
  });
});
