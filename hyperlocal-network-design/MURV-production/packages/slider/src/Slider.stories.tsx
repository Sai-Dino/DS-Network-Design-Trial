import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Slider } from "./Slider";
// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction

const meta = {
  title: "Components/Slider",
  component: Slider,
  argTypes: {
    min: {
      description: "The minimum value for slider ",
      defaultValue: 0,
    },
    max: {
      description: "The Max value for slider ",
      defaultValue: 100,
    },
    dataTestId: {
      description: "The test Id for test",
      defaultValue: "default-slider-test-id",
    },
    showInput: {
      description: "The input value for slider",
      defaultValue: false,
    },
    disabled: {
      description: "Disable the slider by passing disabled parameter",
      defaultValue: false,
    },
    onMouseDown: {
      description: "Handler for custom implementation when the slider is clicked",
      defaultValue: null,
    },
    width: {
      description: "The width of the slider",
      defaultValue: "200px",
    },
    step: {
      description: "The number of steps the slider moves to",
      defaultValue: 10,
    },
  },
  args: {
    range: false,
    onChange(e, value) {
      console.log(value);
    },
    min: 0,
    max: 100,
    showInput: true,
    dataTestId: "single-slider",
  },
  tags: ["autodocs"],
  render: (args) => (
    <div data-testid="slider-storybook-ui-container">
      <Slider {...args} />
    </div>
  ),
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args

export const SimpleSlider: Story = {
  args: {
    range: false,
    onChange(e, value) {
      console.log(value);
    },
    min: 0,
    max: 100,
    showInput: true,
    dataTestId: "single-slider",
  },
};

export const RangeSlider: Story = {
  args: {
    range: true,
    onChange(e, value) {
      console.log(value);
    },
    min: 0,
    max: 100,
    showInput: true,
  },
};
