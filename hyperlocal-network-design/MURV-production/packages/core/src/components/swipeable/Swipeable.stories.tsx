import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Swipeable } from "./Swipeable";

const meta = {
  title: "Components/Swipeable",
  tags: ["autodocs"],
  component: Swipeable,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const SwipeableWrapperExample: Story = {
  render: () => {
    const [swipedDir, setSwipeDir] = useState("");
    return (
      <>
        <Swipeable
          onSwipedRight={() => {
            setSwipeDir("Right");
          }}
          onSwipedLeft={() => {
            setSwipeDir("Left");
          }}
        >
          <button
            type="button"
            style={{
              backgroundColor: "lightgrey",
              padding: "8px",
              margin: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Swipe anywhere inside this button
          </button>
        </Swipeable>
        {swipedDir !== "" ? <div> You just swiped {swipedDir} </div> : null}
      </>
    );
  },
};

export const SwipeableButtonWithCustomDelta: Story = {
  render: () => {
    const [swipedDir, setSwipeDir] = useState("");
    return (
      <>
        <Swipeable
          onSwipedRight={() => {
            setSwipeDir("Right");
          }}
          onSwipedLeft={() => {
            setSwipeDir("Left");
          }}
          delta={{ up: 20, down: 20, left: 10, right: 80 }}
        >
          <button
            type="button"
            style={{
              backgroundColor: "lightgrey",
              padding: "8px",
              margin: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Swipe anywhere inside this button
          </button>
        </Swipeable>
        {swipedDir !== "" ? <div> You just swiped {swipedDir} </div> : null}
      </>
    );
  },
};
