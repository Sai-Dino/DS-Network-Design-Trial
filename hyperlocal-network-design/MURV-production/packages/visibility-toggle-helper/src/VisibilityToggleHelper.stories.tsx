import React from "react";
import { Meta, StoryObj } from "@storybook/react";
import {
  VisibilityToggleHelper,
  IVisibilityToggleHelperProps,
  IVisibilityToggleHelperRef,
} from "./index";

const meta = {
  title: "Components/VisibilityToggleHelper",
  component: VisibilityToggleHelper,
  tags: ["autodocs"],
  args: {
    position: "right-center", // Default value
    action: "hover", // Default value
    offset: { x: 0, y: 0 }, // Default value,

    onVisibilityChange: (isVisibile) => console.log("Visibility changed", isVisibile),
    closeOnClickOutside: true,
    initialIsVisible: false,
    isChildInteractive: false,
    childInteractiveTimeout: 300,
    testId: "visibility-toggle-helper",
    id: "visibility-toggle-helper",
  },
  argTypes: {
    position: {
      options: [
        "right-center",
        "right-top",
        "right-bottom",
        "right-start",
        "right-end",
        "left-center",
        "left-top",
        "left-bottom",
        "left-start",
        "left-end",
        "top-center",
        "top-right",
        "top-left",
        "top-start",
        "top-end",
        "bottom-center",
        "bottom-right",
        "bottom-left",
        "bottom-start",
        "bottom-end",
      ],
      control: {
        type: "radio",
      },
    },
    action: {
      options: ["hover", "click"],
      control: {
        type: "radio",
      },
    },
    offset: {
      control: {
        type: "object",
      },
    },
    closeOnClickOutside: { control: { type: "boolean" } },
    initialIsVisible: { control: { type: "boolean" } },
    isChildInteractive: { control: { type: "boolean" } },
    childInteractiveTimeout: { control: { type: "number" } },
    testId: { control: { type: "text" } },
    id: { control: { type: "text" } },
  },
  decorators: [
    /* The Decorator is for clear visibility of the pop up */
    (Story) => (
      <div
        style={{
          padding: "50px",
          marginLeft: "auto",
          marginRight: "auto",
          width: "fit-content",
        }}
      >
        <Story />
      </div>
    ),
  ],
} as Meta<IVisibilityToggleHelperProps>;

export default meta;

type Story = StoryObj<typeof VisibilityToggleHelper>;

const DefaultTemplate: Story = {
  render: (args) => {
    const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

    return (
      <VisibilityToggleHelper
        {...args}
        ref={toggleRef}
        renderTarget={(props) => (
          <button {...props} style={{ padding: "4px" }} type="button">
            Target
          </button>
        )}
      >
        <div style={{ padding: "8px", backgroundColor: "cyan" }}>I am Visible Now</div>
      </VisibilityToggleHelper>
    );
  },
};

export const Default: Story = {
  ...DefaultTemplate,
  name: "Default",
  args: {
    id: "default",
    testId: "default",
  },
};

const ImperativeCloseHandleTemplate: Story = {
  render: (args) => {
    const toggleRef = React.useRef<IVisibilityToggleHelperRef>(null);

    return (
      <div>
        <VisibilityToggleHelper
          {...args}
          ref={toggleRef}
          renderTarget={(props) => (
            <button {...props} style={{ padding: "4px" }} type="button">
              Target
            </button>
          )}
        >
          <div style={{ padding: "8px", backgroundColor: "cyan" }}>
            I am Visible Now
            <button
              style={{ padding: "4px", marginLeft: "8px", cursor: "pointer" }}
              type="button"
              onClick={() => {
                console.log("Close button clicked");
                toggleRef.current?.close();
              }}
              data-testid={`${args.id}-close-btn`}
            >
              Click to close
            </button>
          </div>
        </VisibilityToggleHelper>
      </div>
    );
  },
  args: {
    offset: { x: 10, y: 0 },
    isChildInteractive: true,
    action: "click",
  },
};

export const ImperativeCloseHandleHover: Story = {
  ...ImperativeCloseHandleTemplate,
  name: "Imperative Close Handle Hover",
  args: {
    offset: { x: 10, y: 0 },
    isChildInteractive: true,
    id: "imperative-close-hover",
    testId: "imperative-close-hover",
  },
};

export const ImperativeCloseHandleClick: Story = {
  ...ImperativeCloseHandleTemplate,
  name: "Imperative Close Handle Click",
  args: {
    offset: { x: 10, y: 0 },
    action: "click",
    id: "imperative-close-click",
    testId: "imperative-close-click",
    closeOnClickOutside: false,
  },
};
