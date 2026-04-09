import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipProps } from "./index";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
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
} satisfies Meta<TooltipProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const TooltipWithIcon: Story = {
  args: {
    showIcon: true,
    position: "top",
    children: "Hover here to see the secret message",
    tooltipText: "Friday is the new Saturday!",
  },
  parameters: {},
};

export const TooltipWithoutIcon: Story = {
  args: {
    showIcon: false,
    position: "top",
    children: "Hover here to see the secret message",
    tooltipText: "Friday is the new Saturday!",
  },
  parameters: {},
};

export const TooltipWithShortText: Story = {
  args: {
    showIcon: true,
    position: "top",
    children: "Hover here to see tooltip with short text",
    tooltipText:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the",
  },
  parameters: {},
};

export const TooltipWithLongText: Story = {
  args: {
    showIcon: true,
    position: "top",
    children: "Hover here to see tooltip with long text",
    tooltipText:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
  },
  parameters: {},
};
