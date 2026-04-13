import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { SwipeableButton } from "./SwipeableButton";

const meta: Meta = {
  title: "Components/SwipeableButton",
  component: SwipeableButton,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const PrimaryButton: Story = {
  args: {
    className: "btn-access",
  },
  render: (args) => {
    const [swipedDir, setSwipeDir] = useState("");
    return (
      <>
        <SwipeableButton
          swipeableProps={{
            onSwipedLeft: () => {
              setSwipeDir("Left");
            },
            onSwipedRight: () => {
              setSwipeDir("Right");
            },
          }}
          {...args}
        >
          {`<< Swipe anywhere inside button >>`}
        </SwipeableButton>
        {swipedDir !== "" ? <div> You just swiped {swipedDir} </div> : null}
      </>
    );
  },
};

export const LeftSwipeableButton: Story = {
  args: {
    className: "btn-access",
  },
  render: (args) => {
    const [swipedDir, setSwipeDir] = useState("");
    return (
      <>
        <SwipeableButton
          swipeableProps={{
            onSwipedLeft: () => {
              setSwipeDir("Left");
            },
          }}
          {...args}
        >
          {`<<  Left Swipeable Button`}
        </SwipeableButton>
        {swipedDir !== "" ? <div> You just swiped {swipedDir} </div> : null}
      </>
    );
  },
};
