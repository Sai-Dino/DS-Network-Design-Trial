import React, { useState } from "react";
import { Meta, StoryObj } from "@storybook/react";
import { SingleDateSelect } from "./index";

const meta = {
  title: "Components/SingleDateSelect",
  component: SingleDateSelect,
  tags: ["autodocs"],
  argTypes: {
    label: {
      description: "The label for the single select component.",
      control: { type: "text" },
    },
    orientation: {
      description: "The orientation of the component, either horizontal or vertical.",
      control: { type: "radio" },
      options: ["horizontal", "vertical"],
      defaultValue: "horizontal",
    },
    onDateChange: {
      description: "Callback function when the date changes.",
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
    type: {
      description: "Type of calendar used in the date picker.",
      control: { type: "radio" },
      options: ["SIMPLE", "ADVANCED"],
    },
    date: {
      description: "Selected date.",
      control: { type: "date" },
    },
    dateOutputFormat: {
      description: "Format for outputting the date.",
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
    const [value, setValue] = useState<Date | string | number>("10-01-2025");
    const onChange = (selectedValue: Date | string | number) => {
      setValue(selectedValue);
    };
    return <SingleDateSelect {...args} onDateChange={onChange} date={value} />;
  },
} as Meta<typeof SingleDateSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleDateSelectStory: Story = {
  args: {
    label: "Select",
    testId: "single-date-select",
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yyyy",
    },
  },
};

export const SingleDateSelectWithTime: Story = {
  args: {
    label: "Select",
    testId: "single-date-select-with-time",
    type: "SIMPLE",
    dateOutputFormat: {
      formatStr: "MM-dd-yyyy",
    },
    onTimeChange: (time: string) => {
      console.log(time);
    },
    timeValue: "10:00 PM",
  },
  render(args) {
    const [value, setValue] = useState<Date | string | number>("10-01-2025");
    const [time, setTime] = useState<string>("10:00 PM");
    const onChange = (selectedValue: Date | string | number) => {
      setValue(selectedValue);
    };
    const onTimeChange = (selectedTime: string) => {
      setTime(selectedTime);
    };
    return (
      <SingleDateSelect
        {...args}
        onDateChange={onChange}
        date={value}
        timeValue={time}
        onDone={() => {}}
        onTimeChange={onTimeChange}
      />
    );
  },
};
