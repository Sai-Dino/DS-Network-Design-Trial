import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { IRatingProps } from "./index";
import { Rating } from "./Rating";

const meta = {
  title: "Components/Rating",
  component: Rating,
  argTypes: {
    rating: {
      description: "Initial rating to be selected.",
      defaultValue: "",
    },
    readOnly: {
      description: "Active/Inactive state of rating.",
      defaultValue: "N/A",
    },
  },
  args: {
    readOnly: true,
  },
  tags: ["autodocs"],
  render: (args) => (
    <div data-testid="rating-storybook-ui-container">
      <Rating {...args} />
    </div>
  ),
} satisfies Meta<IRatingProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    rating: 2,
    readOnly: false,
    onChange: (rating) => console.log("Rating changed:", rating),
  },
};

export const DefaultWithNoInitialSelect: Story = {
  args: {
    rating: 4,
    readOnly: false,
    onChange: (rating) => console.log("Rating changed:", rating),
    id: "default-with-no-initial-select"
  },
};

export const ReadOnly: Story = {
  args: {
    rating: 2,
    readOnly: true,
  },
};
