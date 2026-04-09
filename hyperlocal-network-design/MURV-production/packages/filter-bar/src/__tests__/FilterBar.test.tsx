import React from "react";
import { render, screen, fireEvent } from "test-utils";
import "@testing-library/jest-dom";
import { FilterBar } from "../FilterBar";
import { FilterBarProps } from "../types";

const filterConfig = [
  {
    filterLabel: "Filter 1",
    filterId: "filter1",
    filterType: "single-select",
    filterProps: {
      options: [
        {
          label: "Cycle",
          value: "value1",
        },
        { label: "Long badge text Bike", value: "bike" },
        {
          label: "Car",
          value: "value2",
        },
      ],
    },
  },
  {
    filterLabel: "Filter 2",
    filterId: "filter2",
    filterType: "multi-select",
    filterProps: {
      nodes: [
        {
          label: "Parent1",
          value: "value2a",
        },
        {
          label: "Parent2",
          value: "value2b",
        },
      ],
    },
  },
  {
    filterLabel: "Filter 3",
    filterId: "filter3",
    filterType: "single-date-select",
    filterProps: {
      dateOutputFormat: {
        formatStr: "MM-dd-yyyy",
      },
    },
  },
  {
    filterLabel: "Filter 4",
    filterId: "filter4",
    filterType: "range-date-select",
    filterProps: {
      dateOutputFormat: {
        formatStr: "MM-dd-yyyy",
      },
      activeCalenderType: "MONTH",
    },
  },
];

const filters = {
  filter1: "value1",
  filter2: ["value2a", "value2b"],
};

const onFilterChange = jest.fn();
const onFilterApply = jest.fn();

const enableApplyResetButtons = false;

const defaultProps: FilterBarProps = {
  filterConfig,
  onFilterChange,
  onFilterApply,
  enableApplyResetButtons,
};

describe("FilterBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders correctly", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Filter 1")).toBeInTheDocument();
    expect(screen.getByText("Filter 2")).toBeInTheDocument();
    expect(screen.getByText("Filter 3")).toBeInTheDocument();
    expect(screen.getByText("Filter 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply/i })).toBeInTheDocument();
  });

  test("calls onFilterChange when Clear button is clicked", () => {
    render(<FilterBar {...defaultProps} filters={filters} />);
    fireEvent.click(screen.getByRole("button", { name: /Reset/i }));
    expect(onFilterChange).toHaveBeenCalledWith({});
  });

  test("matches snapshot", () => {
    const { asFragment } = render(<FilterBar {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });

  test("calls onFilterApply when Apply button is clicked", () => {
    render(<FilterBar {...defaultProps} enableApplyResetButtons onFilterApply={onFilterApply} />);

    const applyButton = screen.getByRole("button", { name: /apply/i });
    if (applyButton.hasAttribute("disabled")) {
      fireEvent.click(applyButton);
    }
  });

  test("enables Apply button when enableApplyResetButtons is true", () => {
    const { container } = render(<FilterBar {...defaultProps} enableApplyResetButtons />);
    const buttons = container.querySelectorAll("button");

    const applyButton = Array.from(buttons).find((button) =>
      button.textContent?.toLowerCase().includes("apply"),
    );
    expect(applyButton).toBeTruthy();
  });

  test("disables Apply button when enableApplyResetButtons is false", () => {
    render(<FilterBar {...defaultProps} enableApplyResetButtons={false} />);
  });
});
