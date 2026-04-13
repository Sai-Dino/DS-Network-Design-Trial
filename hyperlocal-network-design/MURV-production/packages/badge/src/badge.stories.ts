import type { Meta, StoryObj } from "@storybook/react";

import { Badge } from "./Badge";

const meta = {
  title: "Components/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    children : {
      control : { type: 'number' }
    },
  },
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {},
};

export const WithNumber: Story = {
  args: {
    children: 30,
  },
};

export const Subtle: Story = {
  args: {
    type: "subtle",
  },
};

export const SubtleWithNumber: Story = {
  args: {
    children: 30,
    type: "subtle",
  },
};

export const Brand: Story = {
  args: {
    type: "brand",
  },
};

export const BrandWithNumber: Story = {
  args: {
    children: 30,
    type: "brand",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledWithNumber: Story = {
  args: {
    children: 30,
    disabled: true,
  },
};
