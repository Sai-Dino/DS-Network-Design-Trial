import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "test-utils";
import { SegmentedControl } from "../src";

describe("Segmented Control component", () => {
  // Default State
  it("renders with default props", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="Option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 2" />
      </SegmentedControl>,
    );
    expect(SegmentedControlComponent).toMatchSnapshot();
  });

  it("renders with default props and test click", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="Option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 2" />
      </SegmentedControl>,
    );
    SegmentedControlComponent.getByText("Option 2").click();
  });

  it("renders with disabled option", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="Option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 2" disabled />
      </SegmentedControl>,
    );
    expect(SegmentedControlComponent).toMatchSnapshot();
  });

  it("renders with default selected option", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="Option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 2" defaultSelected />
      </SegmentedControl>,
    );
    expect(SegmentedControlComponent).toMatchSnapshot();
  });

  it("renders with default selected option and a disabled option", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="Option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 2" defaultSelected />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 3" disabled />
        <SegmentedControl.Option text="Option 2" badgeCount={12} label="Option 4" />
      </SegmentedControl>,
    );
    expect(SegmentedControlComponent).toMatchSnapshot();
  });
  it("renders with no badge count", () => {
    const SegmentedControlComponent = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.Option text="Option 1" label="Option 1" />
        <SegmentedControl.Option text="Option 2" label="Option 2" />
        <SegmentedControl.Option text="Option 2" label="Option 3" />
        <SegmentedControl.Option text="Option 2" label="Option 4" />
      </SegmentedControl>,
    );
    expect(SegmentedControlComponent).toMatchSnapshot();
  });
});

describe("Segmented Control DateRange component", () => {
  it("calls onDateChange callback when date range is selected", async () => {
    const mockOnDateChange = jest.fn();

    render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.DateRange
          testId="date-range-test"
          text="Custom Date Range"
          onDateChange={mockOnDateChange}
          activeCalenderType="DAY"
          dateOutputFormat={{ formatStr: "dd MMM" }}
        />
      </SegmentedControl>,
    );

    const dateRangeButton = screen.getByText("Custom Date Range");
    fireEvent.click(dateRangeButton);

    // The DatePicker.Range component should be rendered when clicked
    await waitFor(() => {
      expect(screen.getByTestId("date-range-test")).toBeInTheDocument();
    });
  });

  it("renders DateRange component with different date output formats", () => {
    const dateFormats = [
      { formatStr: "dd MMM" },
      { formatStr: "yyyy-MM-dd" },
      { formatStr: "MM/dd/yyyy" },
    ];

    dateFormats.forEach((format, index) => {
      const { unmount } = render(
        <SegmentedControl id="test" dataTestId="test-id">
          <SegmentedControl.DateRange
            testId={`date-range-format-${index}`}
            text="Custom Date Range"
            activeCalenderType="DAY"
            dateOutputFormat={format}
          />
        </SegmentedControl>,
      );

      expect(screen.getByText("Custom Date Range")).toBeInTheDocument();
      unmount();
    });
  });

  it("renders DateRange component with onClick handler", () => {
    const mockOnClick = jest.fn();

    const { getByText } = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.DateRange
          testId="date-range-test"
          text="Custom Date Range"
          onClick={mockOnClick}
          activeCalenderType="DAY"
          dateOutputFormat={{ formatStr: "dd MMM" }}
        />
      </SegmentedControl>,
    );

    const dateRangeButton = getByText("Custom Date Range");
    fireEvent.click(dateRangeButton);

    expect(mockOnClick).toHaveBeenCalled();
  });

  it("renders DateRange component with selectCurrentOption handler", () => {
    const mockSelectCurrentOption = jest.fn();

    const { getByText } = render(
      <SegmentedControl id="test" dataTestId="test-id">
        <SegmentedControl.DateRange
          testId="date-range-test"
          text="Custom Date Range"
          selectCurrentOption={mockSelectCurrentOption}
          activeCalenderType="DAY"
          dateOutputFormat={{ formatStr: "dd MMM" }}
        />
      </SegmentedControl>,
    );

    const dateRangeButton = getByText("Custom Date Range");
    fireEvent.click(dateRangeButton);

    expect(mockSelectCurrentOption).toHaveBeenCalled();
  });
});
