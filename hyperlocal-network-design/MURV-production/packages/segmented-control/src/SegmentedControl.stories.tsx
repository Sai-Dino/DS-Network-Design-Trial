import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { SegmentedControl } from "./SegmentedControl";
import { ISegmentedControlProps } from "./types";

const SelectProps = {
  options: [
    {
      label: "Cycle",
      value: "cycle",
    },
    { label: "Bike", value: "bike" },
    {
      label: "Car",
      value: "car ajhsbdf kjasbd",
    },
    {
      label: "Motorcycle",
      value: "motorcycle",
    },
    {
      label: "Bus",
      value: "bus",
    },
    {
      label: "Train",
      value: "train",
    },
  ],
  id: "single-select",
  checkMarkPosition: "right" as const,
  withSearch: false,
  onChange: () => {},
};

const meta = {
  title: "Components/SegmentedControl",
  tags: ["autodocs"],
  argTypes: {
    id: {
      description: "The id of the Segmented Control.",
      control: { type: "text" },
    },
    dataTestId: {
      description: "The data-testid of the Segmented Control.",
      control: { type: "text" },
    },
    children: {
      description:
        "Pass the options control to the Segmented Control. Use the `SegmentedControl.Option` component to pass the options e.g. <SegmentedControl.Option text='Option 1' badgeCount={10} />",
      defaultValue: "Three options",
      options: ["Two options", "Three options", "Four options", "Five options", "No Badge Count"],
      mapping: {
        "Two options": (
          <>
            <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
            <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
          </>
        ),
        "Three options": (
          <>
            <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
            <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
            <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" />
          </>
        ),
        "Four options": (
          <>
            <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
            <SegmentedControl.Option text="Option 2" badgeCount={32} label="option 2" />
            <SegmentedControl.Option text="Option 3" badgeCount={32} label="option 3" disabled />
            <SegmentedControl.Option text="Option 4" badgeCount={10} label="option 4" />
          </>
        ),
        "Five options": (
          <>
            <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
            <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" disabled />
            <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" />
            <SegmentedControl.Option text="Option 4" badgeCount={10} label="option 4" />
            <SegmentedControl.Option text="Option 5" badgeCount={10} label="option 5" />
          </>
        ),
        "No Badge Count": (
          <>
            <SegmentedControl.Option text="Option 1" label="option 1" />
            <SegmentedControl.Option text="Option 2" label="option 2" />
          </>
        ),
        "With Single Select": (
          <>
            <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
            <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
            <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" />
            <SegmentedControl.MoreOptions
              label="Option 4"
              text="Option 5"
              moreOptionProps={SelectProps}
            />
          </>
        ),
      },
    },
  },
  render: (args: ISegmentedControlProps) => (
    <div>
      <SegmentedControl {...args}>{args.children}</SegmentedControl>
    </div>
  ),
} satisfies Meta<React.FC<ISegmentedControlProps>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id",
    children: (
      <>
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
        <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" />
      </>
    ),
  },
};

export const SegmentedControlWithDefaultSelection: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id-default-selection",
    children: (
      <>
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
        <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" />
      </>
    ),
  },
};

export const SegmentedControlWithDisabledOption: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id-disabled-option",
    children: (
      <>
        <SegmentedControl.Option text="Option 1" badgeCount={10} label="option 1" />
        <SegmentedControl.Option text="Option 2" badgeCount={10} label="option 2" />
        <SegmentedControl.Option text="Option 3" badgeCount={10} label="option 3" disabled />
      </>
    ),
  },
};
export const SegmentedControlWithNoBadgeCount: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id-no-badge",
    children: (
      <>
        <SegmentedControl.Option text="Option 1" label="option 1" />
        <SegmentedControl.Option text="Option 2" label="option 2" />
      </>
    ),
  },
};

export const SegmentedControlWithSelectOption: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id-select-option",
    children: (
      <>
        <SegmentedControl.Option text="Option 1" label="option 1" />
        <SegmentedControl.Option text="Option 2" label="option 2" />
        <SegmentedControl.Option text="Option 3" label="option 3" />
        <SegmentedControl.MoreOptions
          label="Option 4"
          text="Option 5"
          moreOptionProps={SelectProps}
        />
      </>
    ),
  },
};

export const SegmentedControlWithDateRange: Story = {
  render: () => {
    const [selectedMonth, setSelectedMonth] = useState(
      new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    );

    const selectMonthProps = {
      options: [
        { label: "Jan 2025", value: "jan-2025" },
        { label: "Feb 2025", value: "feb-2025" },
        { label: "Mar 2025", value: "mar-2025" },
        { label: "Apr 2025", value: "apr-2025" },
        { label: "May 2025", value: "may-2025" },
        { label: "Jun 2025", value: "jun-2025" },
        { label: "Jul 2025", value: "jul-2025" },
        { label: "Aug 2025", value: "aug-2025" },
        { label: "Sep 2025", value: "sep-2025" },
        { label: "Oct 2025", value: "oct-2025" },
        { label: "Nov 2025", value: "nov-2025" },
        { label: "Dec 2025", value: "dec-2025" },
      ],
      id: "month-select",
      value: selectedMonth.toLowerCase().replace(" ", "-"),
      onChange: (value: string) => {
        const monthMap: Record<string, string> = {
          "jan-2025": "Jan 2025",
          "feb-2025": "Feb 2025",
          "mar-2025": "Mar 2025",
          "apr-2025": "Apr 2025",
          "may-2025": "May 2025",
          "jun-2025": "Jun 2025",
          "jul-2025": "Jul 2025",
          "aug-2025": "Aug 2025",
          "sep-2025": "Sep 2025",
          "oct-2025": "Oct 2025",
          "nov-2025": "Nov 2025",
          "dec-2025": "Dec 2025",
        };
        setSelectedMonth(monthMap[value] || selectedMonth);
      },
      checkMarkPosition: "right" as const,
      withSearch: false,
      showBadge: false,
    };

    return (
      <div>
        <SegmentedControl id="date-range-example" dataTestId="date-range-test">
          <SegmentedControl.Option text="10 Jun" label="specific-date" defaultSelected />
          <SegmentedControl.Option text="This Week" label="this-week" />
          <SegmentedControl.MoreOptions
            label="month-selector"
            text={selectedMonth}
            moreOptionProps={selectMonthProps}
          />
          <SegmentedControl.DateRange
            testId="custom-date-range-picker"
            text="Date Range"
            onDateChange={() => {}}
            activeCalenderType="DAY"
            dateOutputFormat={{ formatStr: "dd MMM" }}
            onDone={() => {}}
            onCancel={() => {}}
            minDate={new Date("2024-01-01")}
            maxDate={new Date("2026-12-31")}
            dateRange={{ startDate: null, endDate: null }}
            isDayDisabled={(day: Date) => {
              const currentDate = new Date();
              currentDate.setHours(0, 0, 0, 0);

              const calendarDate = new Date(day);
              calendarDate.setHours(0, 0, 0, 0);

              const ninetyDaysAgo = new Date(currentDate);
              ninetyDaysAgo.setDate(currentDate.getDate() - 90);

              const mondayBeforeNinetyDaysAgo = new Date(ninetyDaysAgo);
              const daysToSubtract = (ninetyDaysAgo.getDay() + 6) % 7;
              mondayBeforeNinetyDaysAgo.setDate(ninetyDaysAgo.getDate() - daysToSubtract);
              const isInRecentPastRange =
                calendarDate >= mondayBeforeNinetyDaysAgo && calendarDate <= currentDate;
              if (isInRecentPastRange) {
                return false;
              }
              const jan1st2025 = new Date(2025, 0, 1);
              const june16th2025 = new Date(2025, 5, 16);
              const isInFirstHalf2025 = calendarDate >= jan1st2025 && calendarDate <= june16th2025;
              if (isInFirstHalf2025) {
                return calendarDate.getDay() !== 1;
              }

              return true;
            }}
            header={<div>Duration</div>}
          />
        </SegmentedControl>
      </div>
    );
  },
  args: {} as any,
};

export const SegmentedControlWithMonthDisabled: Story = {
  render: () => (
    <div>
      <SegmentedControl id="date-range-example" dataTestId="date-range-test">
        <SegmentedControl.Option text="Option 1" label="option 1" />
        <SegmentedControl.DateRange
          activeCalenderType="MONTH"
          text="Month Range"
          dateOutputFormat={{ formatStr: "MMM" }}
          onDone={() => {}}
          onCancel={() => {}}
          minDate={new Date("2024-01-01")}
          maxDate={new Date("2026-12-31")}
          isMonthDisabled={(month: Date) => month.getMonth() === 2}
          header={<div>Duration</div>}
        />
      </SegmentedControl>
    </div>
  ),
  args: {} as any,
};

export const SegmentedControlWithYearDisabled: Story = {
  render: () => (
    <div>
      <SegmentedControl id="date-range-example" dataTestId="date-range-test">
        <SegmentedControl.Option text="Option 1" label="option 1" />
        <SegmentedControl.DateRange
          activeCalenderType="YEAR"
          text="Year Range"
          dateOutputFormat={{ formatStr: "yyyy" }}
          onDone={() => {}}
          onCancel={() => {}}
          minDate={new Date("2020-01-01")}
          maxDate={new Date("2030-12-31")}
          isYearDisabled={(year: Date) => {
            const yearValue = year.getFullYear();
            return [2023, 2024, 2026, 2027].includes(yearValue);
          }}
          header={<div>Duration</div>}
        />
      </SegmentedControl>
    </div>
  ),
  args: {} as any,
};

export const SegmentedControlWithMaxRangeAndTimeChange: Story = {
  render: () => {
    const [selectedStartTime, setSelectedStartTime] = useState<string>("10:00 AM");
    const [selectedEndTime, setSelectedEndTime] = useState<string>("02:00 PM");

    return (
      <div>
        <SegmentedControl id="date-range-example" dataTestId="date-range-test">
          <SegmentedControl.Option text="Quick Select" label="quick-select" />
          <SegmentedControl.DateRange
            testId="combined-features-picker"
            text="Time Selection"
            onDateChange={() => {}}
            activeCalenderType="DAY"
            dateOutputFormat={{ formatStr: "dd MMM yyyy" }}
            onDone={() => {}}
            onCancel={() => {}}
            minDate={new Date("2024-01-01")}
            maxDate={new Date("2026-12-31")}
            dateRange={{ startDate: null, endDate: null }}
            maxRange={{ days: 20 }}
            startTime={selectedStartTime}
            endTime={selectedEndTime}
            onTimeChange={(time: string, type: string) => {
              if (type === "start") {
                setSelectedStartTime(time);
              } else if (type === "end") {
                setSelectedEndTime(time);
              }
            }}
          />
        </SegmentedControl>
      </div>
    );
  },
  args: {} as any,
};

export const SegmentedControlWithCustomWeekStart: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div>
        <p style={{ marginBottom: "8px", fontWeight: 500 }}>Week starts on Sunday (0)</p>
        <SegmentedControl id="week-start-sunday" dataTestId="week-start-sunday-test">
          <SegmentedControl.Option text="Today" label="today" defaultSelected />
          <SegmentedControl.Option text="This Week" label="this-week" />
          <SegmentedControl.DateRange
            testId="date-range-sunday"
            text="Date Range"
            onDateChange={action("onDateChange")}
            activeCalenderType="DAY"
            dateOutputFormat={{ formatStr: "dd MMM" }}
            onDone={action("onDone")}
            onCancel={action("onCancel")}
            minDate={new Date("2024-01-01")}
            maxDate={new Date("2026-12-31")}
            dateRange={{ startDate: null, endDate: null }}
            weekStartsOn={0}
          />
        </SegmentedControl>
      </div>

      <div>
        <p style={{ marginBottom: "8px", fontWeight: 500 }}>Week starts on Monday (1) - Default</p>
        <SegmentedControl id="week-start-monday" dataTestId="week-start-monday-test">
          <SegmentedControl.Option text="Today" label="today" defaultSelected />
          <SegmentedControl.Option text="This Week" label="this-week" />
          <SegmentedControl.DateRange
            testId="date-range-monday"
            text="Date Range"
            onDateChange={action("onDateChange")}
            activeCalenderType="DAY"
            dateOutputFormat={{ formatStr: "dd MMM" }}
            onDone={action("onDone")}
            onCancel={action("onCancel")}
            minDate={new Date("2024-01-01")}
            maxDate={new Date("2026-12-31")}
            dateRange={{ startDate: null, endDate: null }}
            weekStartsOn={1}
          />
        </SegmentedControl>
      </div>

      <div>
        <p style={{ marginBottom: "8px", fontWeight: 500 }}>Week starts on Saturday (6)</p>
        <SegmentedControl id="week-start-saturday" dataTestId="week-start-saturday-test">
          <SegmentedControl.Option text="Today" label="today" defaultSelected />
          <SegmentedControl.Option text="This Week" label="this-week" />
          <SegmentedControl.DateRange
            testId="date-range-saturday"
            text="Date Range"
            onDateChange={action("onDateChange")}
            activeCalenderType="DAY"
            dateOutputFormat={{ formatStr: "dd MMM" }}
            onDone={action("onDone")}
            onCancel={action("onCancel")}
            minDate={new Date("2024-01-01")}
            maxDate={new Date("2026-12-31")}
            dateRange={{ startDate: null, endDate: null }}
            weekStartsOn={6}
          />
        </SegmentedControl>
      </div>
    </div>
  ),
  args: {} as any,
};
