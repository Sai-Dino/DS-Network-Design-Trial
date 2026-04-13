import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Loader, LoaderProps } from "./index";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Loader",
  component: Loader,
  tags: ["autodocs"],
  argTypes: {},
  decorators: [
    (Story) => (
      <div
        style={{
          zoom: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "150px",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<LoaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const LoaderDefault: Story = {
  args: {},
  parameters: {},
};

export const LoaderWithCustomColor: Story = {
  args: {
    customColor: "#3b3b3b",
  },
  parameters: {},
};
