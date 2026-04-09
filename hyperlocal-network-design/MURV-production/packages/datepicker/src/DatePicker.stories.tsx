import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./DatePicker";

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

const meta = {
  title: "Components/DatePicker",
  component: DatePicker.Single,
  tags: ["autodocs"],
  argTypes: {
    type: {
      description: "The type for Single Calender",
      type: {
        name: "string",
        required: false,
      },
      defaultValue: {
        summary: "SIMPLE",
      },
    },
    weekStartsOn: {
      description: "The day the week starts on. 0 = Sunday, 1 = Monday, ..., 6 = Saturday",
      control: { type: "select" },
      options: [0, 1, 2, 3, 4, 5, 6],
      defaultValue: {
        summary: 1,
      },
    },
  },
  args: {
    type: "SIMPLE",
  },
} satisfies Meta<typeof DatePicker.Single>;

export default meta;
type Story = StoryObj<typeof meta>;
type RangeStory = StoryObj<typeof DatePicker.Range>;

const commonProps = {
  testId: "date-picker",
  date: 1715315930,
  onDateChange: (date: Date | string | number) => {
    console.log("onDateChange", date);
  },
  dateOutputFormat: {
    formatStr: "MM-dd-yy",
  },
  type: "SIMPLE",
};

const commonArgTypes = {
  maxRange: {
    years: {
      description: "A Maximum Range for year to be selected",
      type: {
        name: "object",
        required: false,
      },
    },
  },
  activeCalenderType: {
    description: "A Type for which calender to rendered DAY OR MONTH OR YEAR",
    type: {
      value: "DAY",
      name: "string",
      required: false,
    },
    defaultValue: "DAY",
  },
  dateOutputFormat: {
    formatStr: {
      description: "A String to supply format of date to be triggered",
      type: {
        name: "string",
        required: true,
      },
    },
    options: {
      description: "A Object to supply localization of date check date-fns for more details",
      type: {
        name: "string",
        required: false,
      },
    },
  },
  min: {
    description: "Minimum Date for Picker range",
    type: {
      value: "",
      name: "other",
      required: false,
    },
  },
  max: {
    description: "Maximum Date for Picker range",
    type: {
      value: "",
      name: "other",
      required: false,
    },
  },
  weekStartsOn: {
    description: "The day the week starts on. 0 = Sunday, 1 = Monday, ..., 6 = Saturday",
    control: { type: "select" },
    options: [0, 1, 2, 3, 4, 5, 6],
    defaultValue: 1,
  },
};

export const SingleSimpleDatePicker: Story = {
  args: {
    ...commonProps,
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
  },
  name: "Single Date Picker With Simple Type ",
};

export const DateTimePicker: Story = {
  args: {
    ...commonProps,
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
    onTimeChange: (time: string, type: string) => {
      console.log("time", time);
      console.log("type", type);
    },
    timeValue: "10:00 AM",
    onCancel: () => {},
    onDone: () => {},
  },
  name: "Date Time Picker",
};

export const SingleAdvancedDatePicker: Story = {
  render: () => (
    <DatePicker.Single
      {...commonProps}
      type="ADVANCED"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
    />
  ),
  name: "Single Date Picker With Advanced Type ",
  args: {
    ...commonProps,
    type: "ADVANCED",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
  },
};

export const DateRange: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="date-range-picker"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      dateRange={{ startDate: new Date(2024, 4, 18), endDate: new Date(2024, 4, 20) }}
      maxRange={{ days: 20 }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      minDate={new Date(2024, 5, 1)}
      maxDate={new Date(2024, 5, 30)}
    />
  ),
  argTypes: {
    onDateChange: {
      description: "A Callback triggered when day range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
    maxRange: {
      days: {
        description: "A Maximum Range for days to be selected",
        type: {
          name: "object",
          required: false,
        },
      },
    },
  },
  name: "Date Range Picker",
};

export const DateTimeRange: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="date-time-range-picker"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      dateRange={{ startDate: new Date(2024, 4, 18), endDate: new Date(2024, 4, 20) }}
      maxRange={{ days: 20 }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      minDate={new Date(2024, 5, 1)}
      maxDate={new Date(2024, 5, 30)}
      onTimeChange={() => {}}
      startTime="10:00 AM"
      endTime="11:00 AM"
      onDone={() => {}}
    />
  ),
  argTypes: {
    onDateChange: {
      description: "A Callback triggered when day range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
    maxRange: {
      days: {
        description: "A Maximum Range for days to be selected",
        type: {
          name: "object",
          required: false,
        },
      },
    },
  },
  name: "Date Time Range Picker",
};

export const DateRangeWithRangeOptions: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="date-range-picker-with-range-options"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      dateRangeOptions={DateOptions}
      minDate={new Date(2022, 5, 1)}
      maxDate={new Date()}
    />
  ),
  argTypes: {
    onDateChange: {
      description: "A Callback triggered when day range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
    maxRange: {
      days: {
        description: "A Maximum Range for days to be selected",
        type: {
          name: "object",
          required: false,
        },
      },
    },
  },
  name: "Date Range Picker with Range Options",
};

export const MonthRange: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="month-range-picker"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      dateRange={{ startDate: new Date(2027, 5, 15), endDate: new Date(2027, 8, 20) }}
      maxRange={{ months: 3 }}
      activeCalenderType="MONTH"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      minDate={new Date(2024, 0, 1)}
      maxDate={new Date(2024, 11, 31)}
    />
  ),
  args: {},
  argTypes: {
    onMonthChange: {
      description: "A Callback triggered when month range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
  },
  name: "Month Range Picker",
};

export const YearRange: RangeStory = {
  render: () => (
    <DatePicker.Range
      testId="year-range-picker"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      // dateRange={{ startDate: new Date(2024, 0, 1), endDate: new Date(2030, 11, 31) }}
      maxRange={{ years: 3 }}
      activeCalenderType="YEAR"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      minDate={new Date(2024, 0, 1)}
      maxDate={new Date(2030, 11, 31)}
      isYearDisabled={(day) => {
        if (day.getFullYear() === 2035) {
          return false;
        }
        return true;
      }}
    />
  ),
  args: {},
  argTypes: {
    onYearChange: {
      description: "A Callback triggered when year range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
  },
  name: "Year Range Picker",
};

export const OnDoneOnCancel: RangeStory = {
  render: () => (
    <DatePicker.Range
      testId="callback-range-picker"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      onDone={() => {}}
      onCancel={() => {}}
      onTimeChange={() => {}}
    />
  ),
  args: {},
  argTypes: {
    onYearChange: {
      description: "A Callback triggered when year range is selected",
      type: {
        name: "function",
        required: false,
      },
    },
    ...(commonArgTypes as any),
  },
  name: "OnDone OnCancel Callbacks",
};

export const SingleDatePickerStartingSunday: Story = {
  args: {
    ...commonProps,
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
    weekStartsOn: 0,
  },
  name: "Single Date Picker - Week Starts Sunday",
};

export const SingleDatePickerStartingMonday: Story = {
  args: {
    ...commonProps,
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
    weekStartsOn: 1,
  },
  name: "Single Date Picker - Week Starts Monday (Default)",
};

export const SingleDatePickerStartingSaturday: Story = {
  args: {
    ...commonProps,
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yy",
    },
    weekStartsOn: 6,
  },
  name: "Single Date Picker - Week Starts Saturday",
};

export const DateRangeStartingSunday: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="date-range-picker-sunday"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      dateRange={{ startDate: new Date(2024, 4, 18), endDate: new Date(2024, 4, 20) }}
      maxRange={{ days: 20 }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      weekStartsOn={0}
    />
  ),
  name: "Date Range Picker - Week Starts Sunday",
};

export const DateRangeStartingSaturday: RangeStory = {
  render: () => (
    <DatePicker.Range
      {...commonProps}
      testId="date-range-picker-saturday"
      onDateChange={({ startDate, endDate }) => {
        console.log({ startDate, endDate });
      }}
      dateRange={{ startDate: new Date(2024, 4, 18), endDate: new Date(2024, 4, 20) }}
      maxRange={{ days: 20 }}
      activeCalenderType="DAY"
      dateOutputFormat={{
        formatStr: "MM-dd-yy",
      }}
      weekStartsOn={6}
    />
  ),
  name: "Date Range Picker - Week Starts Saturday",
};
