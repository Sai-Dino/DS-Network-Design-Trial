import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tile, ITileProps } from "./index";

const meta = {
  title: "Components/Tile",
  component: Tile.SimpleTile,
  args: {
    label: "Label",
    heading: "Heading",
    description: "Description",
    onClick() {},
    selected: false,
    disabled: false,
    tabIndex: 0,
    width: "150px",
  },
  tags: ["autodocs"],
} satisfies Meta<ITileProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function TileWithIconStory(props: ITileProps) {
  return <Tile.TileWithIcon {...props} />;
}

export const TileWithIcon: Story = {
  render: TileWithIconStory,
  args: {
    label: "Label",
    heading: "Heading",
    description: "desc",
    infoText: "Lorem Ipsum",
    onClick() {},
    selected: false,
    // disabled: true,
    tabIndex: 0,
  },
  name: "Tile With Icon",
};

export const SimpleTile: Story = {
  args: {
    label: "Label",
    heading: "Heading",
    description: "Description",
    onClick() {},
    selected: false,
    disabled: false,
    tabIndex: 0,
  },
};
