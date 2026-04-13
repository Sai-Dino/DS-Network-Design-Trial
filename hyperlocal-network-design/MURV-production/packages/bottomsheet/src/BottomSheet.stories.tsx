import React from "react";
import type { StoryObj } from "@storybook/react";
import { BottomSheetStory } from "./stories";

const meta = {
  title: "Components/BottomSheet",
  tags: ["autodocs"],
  args: {
    HeaderProps: {
      titleProps: <p>Bottomsheet Title</p>,
      backIconProps: {
        onBack: () => console.log("back icon"),
      },
    },
    closeIconProps: {
      closeSheet: () => console.log("close icon"),
    },
    ContentProps: <div>this is a bottomsheet content</div>,
    ActionsProps: (
      <div>
        <button type="button">Clear</button>
        <button type="button">Apply</button>
      </div>
    ),
    dataTestId: "bottom-sheet-content-test-id",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleBottomSheet: Story = {
  render: BottomSheetStory,
  args: {
    HeaderProps: {
      titleProps: <p>Bottomsheet Title</p>,
      backIconProps: {
        onBack: () => console.log("back icon"),
      },
    },
    closeIconProps: {
      closeSheet: () => console.log("close icon"),
    },
    ContentProps: <div>this is a bottomsheet content</div>,
    ActionsProps: (
      <div>
        <button type="button">Clear</button>
        <button type="button">Apply</button>
      </div>
    ),
    dataTestId: "bottom-sheet-content-test-id",
  },
};
