import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { Add } from "@murv/icons";
import { ButtonGroup } from "./components/ButtonGroup";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta: Meta = {
  title: "Components/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;
export const RightAlignment: Story = {
  args: {
    buttons: [
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        PrefixIcon: Add,
        onClick: () => console.log("seccc"),
      },
      {
        buttonType: "primary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
        onClick: () => console.log("pri"),
      },
      {
        buttonType: "inline",
        buttonStyle: "danger",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        disabled: true,
        PrefixIcon: Add,
        onClick: () => console.log("brand"),
      },
    ],
    alignment: "right",
  },
  render: (args) => <ButtonGroup buttons={args.buttons} alignment={args.alignment} />,
};

export const LeftAlignment: Story = {
  args: {
    btnProps: [
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        PrefixIcon: Add,
      },
      {
        buttonType: "primary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
      },
      {
        buttonType: "inline",
        buttonStyle: "danger",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        disabled: true,
        PrefixIcon: Add,
      },
    ],
  },
  render: (args) => <ButtonGroup buttons={args.btnProps} padding="0px" />,
};

export const CenterAlignment: Story = {
  args: {
    btnProps: [
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        PrefixIcon: Add,
      },
      {
        buttonType: "primary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
      },
      {
        buttonType: "inline",
        buttonStyle: "danger",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        children: "Lorem ipsum",
      },
      {
        buttonType: "secondary",
        buttonStyle: "brand",
        disabled: true,
        PrefixIcon: Add,
      },
    ],
  },
  render: (args) => <ButtonGroup buttons={args.btnProps} alignment="center" />,
};

export const Test: Story = {
  render: () => (
    <ButtonGroup buttons={[{ PrefixIcon: Add, buttonType: "tertiary", buttonStyle: "brand" }]} />
  ),
};
