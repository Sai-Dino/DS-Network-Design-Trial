import { StoryObj, Meta } from "@storybook/react";
import TileBar from "./Tilebar";
import { ITileBarProps } from "./types";

const meta = {
  title: "Components/TileBar",
  component: TileBar,
  tags: ["autodocs"],
} as Meta<ITileBarProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TileBarStory: Story = {
  args: {
    tiles: [
      {
        label: "Label1",
        heading: "Heading1",
        description: "Description1",
        selected: false,
        disabled: true,
        tabIndex: 0,
        id: "1",
        testId: "1",
      },
      {
        label: "Label2",
        heading: "Heading2",
        description: "Description2",
        selected: false,
        disabled: false,
        tabIndex: 0,
        id: "2",
        testId: "2",
      },
      {
        label: "Label3",
        heading: "Heading3",
        description: "Description3",
        selected: true,
        disabled: false,
        tabIndex: 0,
        id: "3",
        testId: "3",
        infoText: "Lorem Ipsum",
      },
    ],
    onClick(e, id) {
      console.log("onClick", id, "current target id => ", e.currentTarget.id);
    },
    onFocus(_e, id) {
      console.log("onFocus", id);
    },
    onHover(_e, id) {
      console.log("onHover", id);
    },
  },
};

export const TileBarStoryWithDivider: Story = {
  args: {
    tiles: [
      {
        label: "Label1",
        heading: "Heading1",
        description: "Description1",
        selected: false,
        disabled: true,
        hasDivider: true,
        tabIndex: 0,
        id: "1",
        testId: "1",
      },
      {
        label: "Label2",
        heading: "Heading2",
        description: "Description2",
        selected: true,
        disabled: false,
        tabIndex: 0,
        id: "2",
        testId: "2",
      },
      {
        label: "Label3",
        heading: "Heading3",
        description: "Description3",
        selected: false,
        disabled: false,
        hasDivider: true,
        tabIndex: 0,
        id: "3",
        testId: "3",
      },
    ],
    onClick(e, id) {
      console.log("onClick", id, "Current Target", e.currentTarget);
    },
    onFocus(_e, id) {
      console.log("onFocus", id);
    },
    onHover(_e, id) {
      console.log("onHover", id);
    },
  },
};
