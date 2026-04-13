import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { RangeDateSelect } from "./index";

const meta = {
  title: "Components/RangeDateSelect",
  component: RangeDateSelect,
  tags: ["autodocs"],
  argTypes: {
    label: {
      description: "The label for the range date select component.",
      control: { type: "text" },
    },
    orientation: {
      description: "The orientation of the component, either horizontal or vertical.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
    },
    onDateChange: {
      description: "Callback function when the date range changes.",
      control: { type: "function" },
    },
    buttonWidth: {
      description: "Width of the dropdown button.",
      control: { type: "text" },
    },
    disabled: {
      description: "Disable the dropdown button.",
      control: { type: "boolean" },
    },
    withBorder: {
      description: "Show border around the dropdown button.",
      control: { type: "boolean" },
    },
    renderButtonIcon: {
      description: "Render custom dropdown button icon.",
      control: { type: "function" },
    },
    triggerType: {
      description: "Type of trigger for the dropdown button.",
      control: { type: "radio" },
      options: ["standAlone", "filter"],
    },
    maxBadgeWidth: {
      description: "Maximum width of the badge.",
      control: { type: "text" },
    },
    dateRange: {
      description: "Selected date range.",
      control: { type: "object" },
    },
    maxRange: {
      description: "Maximum range for the date selection.",
      control: { type: "object" },
    },
    isDayDisabled: {
      description: "Function to disable specific days.",
      control: { type: "function" },
    },
    isMonthDisabled: {
      description: "Function to disable specific months.",
      control: { type: "function" },
    },
    isYearDisabled: {
      description: "Function to disable specific years.",
      control: { type: "function" },
    },
    activeCalenderType: {
      description: "Type of calendar used in the date picker.",
      control: { type: "radio" },
      options: ["DAY", "MONTH", "YEAR"],
    },
    header: {
      description: "Custom header element for the date picker.",
      control: { type: "object" },
    },
    dateOutputFormat: {
      description: "Format for outputting the date.",
      control: { type: "object" },
    },
    minDate: {
      description: "Minimum selectable date.",
      control: { type: "date" },
    },
    maxDate: {
      description: "Maximum selectable date.",
      control: { type: "date" },
    },
    width: {
      description: "Width of the date picker.",
      control: { type: "number" },
    },
    testId: {
      description: "Test ID for the date picker.",
      control: { type: "text" },
    },
    onDone: {
      description: "Callback function when done is clicked.",
      control: { type: "function" },
    },
    onCancel: {
      description: "Callback function when cancel is clicked.",
      control: { type: "function" },
    },
    className: {
      description: "CSS class name for the date picker.",
      control: { type: "text" },
    },
  },
  render(args) {
    const [start, setStartDate] = useState<string | Date | number>("2025-10-01");
    const [end, setEndDate] = useState<string | Date | number>("2025-10-01");
    return (
      <RangeDateSelect
        {...args}
        onDateChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
        maxBadgeWidth="180px"
        dateRange={{ startDate: new Date(start), endDate: new Date(end) }}
      />
    );
  },
} as Meta<typeof RangeDateSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DayRangeDateSelect: Story = {
  args: {
    testId: "day-range-select",
    label: "Select Date Range",
    dateOutputFormat: {
      formatStr: "yyyy-MM-dd",
    },
    activeCalenderType: "DAY",
  },
};

export const DayRangeDateTimeSelect: Story = {
  args: {
    testId: "day-range-time-select",
    label: "Select Date Time Range",
    dateOutputFormat: {
      formatStr: "yyyy-MM-dd",
    },
    activeCalenderType: "DAY",
    onTimeChange: () => {},
    startTime: "10:00 AM",
    endTime: "11:00 AM",
  },
  render(args) {
    const [start, setStartDate] = useState<string | Date | number>("2025-10-01");
    const [end, setEndDate] = useState<string | Date | number>("2025-10-01");
    const [startTime, setStartTime] = useState<string>("10:00 AM");
    const [endTime, setEndTime] = useState<string>("11:00 AM");

    const handleTimeChange = (time: string, type: string) => {
      if (type === "start") {
        setStartTime(time);
      } else if (type === "end") {
        setEndTime(time);
      }
    };

    return (
      <RangeDateSelect
        {...args}
        onDateChange={({ startDate, endDate }) => {
          setStartDate(startDate);
          setEndDate(endDate);
        }}
        maxBadgeWidth="180px"
        dateRange={{ startDate: new Date(start), endDate: new Date(end) }}
        onTimeChange={handleTimeChange}
        startTime={startTime}
        endTime={endTime}
        onDone={() => {}}
      />
    );
  },
};

export const MonthRangeDateSelect: Story = {
  args: {
    testId: "month-range-select",
    label: "Select Date Range",
    dateOutputFormat: {
      formatStr: "yyyy-MM-dd",
    },
    activeCalenderType: "MONTH",
  },
};

export const YearRangeDateSelect: Story = {
  args: {
    testId: "year-range-select",
    label: "Select Date Range",
    dateOutputFormat: {
      formatStr: "yyyy-MM-dd",
    },
    activeCalenderType: "YEAR",
  },
};
