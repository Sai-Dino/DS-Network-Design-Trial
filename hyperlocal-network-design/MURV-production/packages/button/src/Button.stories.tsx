import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Add, ExpandMore } from "@murv/icons";
import { Button } from "./components/Button";
import { ButtonSize, BtnStyleType } from "./types";
// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    SuffixIcon: ExpandMore,
    PrefixIcon: Add,
    className: "btn-access",
  },
  render: (args) => (
    <Button
      buttonType={BtnStyleType.primary}
      size={ButtonSize.small}
      buttonStyle="danger"
      {...args}
    >
      Lorem ipsum dolor sit amet, consectetur adipiscing elit
    </Button>
  ),
};

export const Disabled: Story = {
  args: {
    buttonType: BtnStyleType.primary,
    disabled: true,
    SuffixIcon: ExpandMore,
  },
  render: (args) => <Button {...args}>Click Here !!</Button>,
};

export const PrefixWithLabel: Story = {
  args: {
    buttonStyle: "brand",
    SuffixIcon: ExpandMore,
    size: ButtonSize.large,
  },
  render: (args) => (
    <Button buttonType="primary" {...args}>
      Click Here !!
    </Button>
  ),
};

export const TertiaryBtn: Story = {
  args: {
    buttonType: BtnStyleType.tertiary,
    buttonStyle: "brand",
    type: "reset",
    size: ButtonSize.large,
  },
  render: (args) => <Button {...args}>Reset</Button>,
};

export const Secondary: Story = {
  args: {
    buttonType: "ascent",
    buttonStyle: "danger",
    SuffixIcon: ExpandMore,
    size: ButtonSize.large,
  },
  render: (args) => <Button {...args}>Click Here !!</Button>,
};

export const Large: Story = {
  args: {
    buttonType: "ascent",
    SuffixIcon: ExpandMore,
    size: ButtonSize.large,
  },
  render: (args) => <Button {...args} />,
};

export const Small: Story = {
  args: {
    buttonType: "ascent",
    disabled: false,
    SuffixIcon: ExpandMore,
    size: ButtonSize.small,
  },
  render: (args) => <Button {...args} />,
};

export const LoadingBtn: Story = {
  args: {
    buttonType: "ascent",
    SuffixIcon: ExpandMore,
    size: ButtonSize.small,
    isLoading: true,
  },
  render: (args) => <Button {...args} />,
};

// Configure argTypes to have controls in Storybook UI
Primary.argTypes = {
  buttonType: { control: "select" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
  PrefixIcon: { control: "text" },
};

Disabled.argTypes = {
  buttonType: { control: "select" },
  disabled: { control: "boolean" },
  SuffixIcon: { control: "text" },
};

PrefixWithLabel.argTypes = {
  buttonType: { control: "select" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
};

Secondary.argTypes = {
  buttonType: { control: "select" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
};

Large.argTypes = {
  buttonType: { control: "select" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
};

Small.argTypes = {
  buttonType: { control: "select" },
  disabled: { control: "boolean" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
};

LoadingBtn.argTypes = {
  buttonType: { control: "select" },
  SuffixIcon: { control: "text" },
  size: { control: "text" },
  isLoading: { control: "boolean" },
};
