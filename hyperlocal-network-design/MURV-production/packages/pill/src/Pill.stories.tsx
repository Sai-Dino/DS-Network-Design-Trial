import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Assignment, AddTask } from "@murv/icons";
import { Pill } from "./Pill";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction

const meta = {
  title: "Components/Pill",
  component: Pill.PillSmall,
  tags: ["autodocs"],
} satisfies Meta<typeof Pill.PillSmall>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
  label: "Label",
  onClick: () => {},
  selected: true,
  disabled: false,
  tabIndex: 0,
  value: "value",
};

export const PillSmall: Story = {
  args,
};

export const PillMedium: Story = {
  render: Pill.PillMedium,
  args,
  name: "Pill Medium",
};

export const PillLarge: Story = {
  render: Pill.PillLarge,
  args,
  name: "Pill Large",
};

export const SimplePill: Story = {
  render: () => (
    <Pill.PillMedium
      label="Label"
      onClick={() => {}}
      selected
      disabled={false}
      tabIndex={0}
      value="value"
      prefixIcon={<Assignment />}
      suffixIcon={<AddTask />}
    />
  ),
  args,
  name: "Simple Pill",
};
