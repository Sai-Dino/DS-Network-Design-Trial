import React from "react";
import { render, fireEvent } from "test-utils";
import { DatePicker } from "../src";

const commonProps = {
  testId: "date-picker",
  date: new Date(1716890460),
  onDateChange: () => {},
  onDone: () => {},
  onCancel: () => {},
  type: "SIMPLE",
};

describe("Single Date Picker Test", () => {
  const FIXED_DATE = new Date(2023, 5, 5);
  let originalDate: DateConstructor;

  beforeAll(() => {
    originalDate = global.Date;

    global.Date = jest.fn(() => FIXED_DATE) as unknown as DateConstructor;
    global.Date.now = jest.fn(() => FIXED_DATE.getTime());
    global.Date.UTC = originalDate.UTC;
    global.Date.parse = originalDate.parse;
  });

  afterAll(() => {
    global.Date = originalDate;
  });
  test("Single Date Picker Date Click", () => {
    const { getByTestId } = render(
      <DatePicker.Single
        {...commonProps}
        type="SIMPLE"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const singleDatePicker = getByTestId("date-picker");
    const mockClick = jest.fn();
    const dates = singleDatePicker.querySelectorAll(
      "[data-date-index]",
    ) as NodeListOf<HTMLTableCellElement>;
    let enabledDate: HTMLTableCellElement | null = null;
    for (let i = 0; i < dates.length; i += 1) {
      const disabled = Boolean(dates.item(i).getAttribute("disabled") || "false") as boolean;
      if (!disabled) {
        enabledDate = dates.item(i);
        break;
      }
    }
    if (enabledDate) {
      enabledDate.onclick = mockClick;
      fireEvent.click(enabledDate);
      expect(mockClick).toHaveBeenCalled();
    }
  });

  test("Single Date Picker Snapshot", () => {
    const { getByTestId } = render(
      <DatePicker.Single
        {...commonProps}
        type="SIMPLE"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );

    expect(getByTestId("date-picker")).toMatchSnapshot();
  });

  test("Single Date Picker with Time Snapshot", () => {
    const { getByTestId } = render(
      <DatePicker.Single
        {...commonProps}
        type="SIMPLE"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
        onTimeChange={() => {}}
      />,
    );
    expect(getByTestId("date-picker")).toMatchSnapshot();
  });
});

describe("Date Range Picker", () => {
  test("Date Range Select", () => {
    const onDateChangeMock = jest.fn();
    const { getByTestId } = render(
      <DatePicker.Range
        {...commonProps}
        testId="date-range-picker"
        onDateChange={onDateChangeMock}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const dateRangePicker = getByTestId("date-range-picker");
    const tableGrid = dateRangePicker.querySelector('[role = "grid"]');
    const dates = tableGrid?.querySelectorAll(
      "[data-date-index]",
    ) as NodeListOf<HTMLTableCellElement>;
    let startDate: HTMLTableCellElement | null = null;
    let endDate: HTMLTableCellElement | null = null;
    let days = 15;

    for (let i = 0; i < dates.length; i += 1) {
      const disabled = dates.item(i).hasAttribute("disabled") as boolean;
      if (!startDate && !disabled) {
        startDate = dates.item(i);
      } else if (!endDate && !disabled && days <= 0) {
        endDate = dates.item(i);
      }
      days -= 1;
      if (startDate && endDate) {
        break;
      }
    }
    if (startDate && endDate) {
      fireEvent.click(startDate);
      fireEvent.click(endDate);
      expect(onDateChangeMock).toHaveBeenCalled();
    }
  });

  test("on done click event", () => {
    const onDoneClickMock = jest.fn();
    const { getByTestId } = render(
      <DatePicker.Range
        {...commonProps}
        testId="date-range-picker"
        onDateChange={() => {}}
        onDone={onDoneClickMock}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const dateRangePicker = getByTestId("date-range-picker");
    const doneEle = dateRangePicker.querySelector('[type = "submit"]') as HTMLElement;
    fireEvent.click(doneEle);
    expect(onDoneClickMock).toHaveBeenCalled();
  });

  test("Disabled the passed date", () => {
    const dateToTest = new Date(new Date().setDate(15));
    const { getByTestId } = render(
      <DatePicker.Range
        {...commonProps}
        testId="date-range-picker"
        onDateChange={() => {}}
        isDayDisabled={(day) => {
          if (day.getDate() === 15) {
            return true;
          }
          return false;
        }}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const dateRangePicker = getByTestId("date-range-picker");
    const tableGrid = dateRangePicker.querySelectorAll(
      '[role = "grid"]',
    ) as NodeListOf<HTMLTableElement>;
    let date: HTMLTableCellElement | null = null;
    for (let i = 0; i < tableGrid.length; i += 1) {
      if (!date) {
        date = tableGrid
          .item(i)
          .querySelector(`[data-date-value = "${dateToTest.toDateString()}"]`);
      }
    }
    expect(date?.hasAttribute("disabled")).toBeDefined();
  });

  const DateOptions = [
    {
      title: "Custom",
      isCustom: true,
      defaultSelected: true,
      dateRange: {
        startDate: new Date(),
        endDate: new Date(),
      },
    },
    {
      title: "last 3 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 3)),
      },
    },
    {
      title: "last 7 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 7)),
      },
    },
    {
      title: "last 15 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 15)),
      },
    },
    {
      title: "last 30 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    {
      title: "last 45 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 45)),
      },
    },
    {
      title: "last 60 days",
      dateRange: {
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() - 60)),
      },
    },
  ];

  test("Date Range options select", () => {
    const onDateChangeMock = jest.fn();
    const { getByTestId, getByText } = render(
      <DatePicker.Range
        {...commonProps}
        dateRangeOptions={DateOptions}
        testId="test-date-range-option-selector"
        onDateChange={(val) => onDateChangeMock(val)}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const rangeOptions = getByTestId("test-date-range-option-selector");
    expect(rangeOptions).toBeInTheDocument();
    const getlast3days = getByText("last 3 days");
    fireEvent.click(getlast3days);
    expect(onDateChangeMock).toHaveBeenCalled();
  });
  test("Date Range more options select", () => {
    const onDateChangeMock = jest.fn();
    const { getByTestId, getByText } = render(
      <DatePicker.Range
        {...commonProps}
        dateRangeOptions={DateOptions}
        testId="more-date-range-options"
        onDateChange={(val) => onDateChangeMock(val)}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    const moreRangeOptions = getByTestId("more-date-range-options");
    expect(moreRangeOptions).toBeInTheDocument();
    fireEvent.click(moreRangeOptions);
    const getlast45days = getByText("last 45 days");
    expect(getlast45days).toBeInTheDocument();
    fireEvent.click(getlast45days);
    expect(onDateChangeMock).toHaveBeenCalled();
  });
  test("Date Range options Snapshot", () => {
    const { getByTestId } = render(
      <DatePicker.Range
        {...commonProps}
        dateRangeOptions={DateOptions}
        testId="date-range-picker-with-range-options"
        onDateChange={() => {}}
        activeCalenderType="DAY"
        dateOutputFormat={{ formatStr: "MM-dd-yyyy" }}
      />,
    );
    expect(getByTestId("date-range-picker-with-range-options")).toMatchSnapshot();
  });
});
