import React, { useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { FocusTrap, WithFocusTrap } from "./FocusTrap";

const meta = {
  title: "Components/FocusTrap",
  tags: ["autodocs"],
  component: FocusTrap,
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const FocusTrapComponentStory: Story = {
  render: () => {
    const button4Ref = useRef<HTMLButtonElement>(null);
    return (
      <div
        style={{
          backgroundColor: "lightcyan",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
          borderRadius: "4px",
        }}
      >
        <strong style={{ color: "red" }}>
          <p>
            Please note that if you want to use this functionality, ensure that you provide a way
            for the users to exit the focus trapped area, by passing the{" "}
            <code
              style={{ backgroundColor: "lightyellow", padding: "0 4px", fontFamily: "monospace" }}
            >
              escapeHandler
            </code>{" "}
            callback. This is non negotiable!
          </p>
        </strong>
        <p>Outside the Focus trapped area</p>
        <button type="button">Button 0</button>
        <FocusTrap
          /// It is very very inmportant to ensure that users have a way of exiting the focus trapped area.
          escapeHandler={() => button4Ref.current?.focus()}
        >
          <div
            style={{
              backgroundColor: "lightgrey",
              padding: "8px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              borderRadius: "4px",
            }}
          >
            <p>Inside the Focus trapped area</p>
            <button type="button">Button 1</button>
            <button type="button">Button 2</button>
            <button type="button">Button 3</button>
          </div>
        </FocusTrap>
        <button ref={button4Ref} type="button">
          Button 4
        </button>
      </div>
    );
  },
};

export const WithFocusTrapHOCStory: Story = {
  render: () => {
    const button4Ref = useRef<HTMLButtonElement>(null);

    const TestComponent: React.FC = () => (
      <div
        style={{
          backgroundColor: "lightgrey",
          padding: "8px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          borderRadius: "4px",
        }}
      >
        <p>Inside the Focus trapped area</p>
        <button type="button">Button 1</button>
        <button type="button">Button 2</button>
        <button type="button">Button 3</button>
      </div>
    );

    // It is very very inmportant to ensure that users have a way of exiting the focus trapped area.
    const FocusTrappedComponent = WithFocusTrap(TestComponent, () => button4Ref.current?.focus());

    return (
      <div
        style={{
          backgroundColor: "lightcyan",
          padding: "8px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: "8px",
          borderRadius: "4px",
        }}
      >
        <strong style={{ color: "red" }}>
          <p>
            Please note that if you want to use this functionality, ensure that you provide a way
            for the users to exit the focus trapped area, by passing the{" "}
            <code
              style={{ backgroundColor: "lightyellow", padding: "0 4px", fontFamily: "monospace" }}
            >
              escapeHandler
            </code>{" "}
            callback. This is non negotiable!
          </p>
        </strong>
        <p>Outside the Focus trapped area</p>
        <button type="button">Button 0</button>
        <FocusTrappedComponent />
        <button ref={button4Ref} type="button">
          Button 4
        </button>
      </div>
    );
  },
};
