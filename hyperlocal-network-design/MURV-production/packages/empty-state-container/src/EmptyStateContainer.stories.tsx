import React from "react";
import { StoryObj, Meta } from "@storybook/react";
import EmptyContainer, { TEmptyStateContainerProps } from "./index";
// @ts-ignore
import Clock from "../assets/clock.png";

const meta = {
  title: "Components/EmptyStateContainer",
  component: EmptyContainer,
  argTypes: {
    icon: {
      description: "Icon is passed to show the visual represenntation of empty state ",
      defaultValue: "",
    },
    imageUrl: {
      description: "Pass Image in place icon.",
      defaultValue: "",
    },
    alt: {
      description: "Alternate name for the image.",
      defaultValue: "",
    },
    height: {
      description: "Height of the image.",
      defaultValue: "",
    },
    width: {
      description: "Width of the  image.",
      defaultValue: "",
    },
    primaryMessage: {
      description: "Primary message for the Empty State.",
      defaultValue: "",
    },
    userMessage: {
      description: "User Mesaage to convey the user what to do next after getting Empty State.",
      defaultValue: "",
    },
    buttonGroupProps: {
      description: "Button group props where user can click to do the next action.",
      defaultValue: null,
    },
  },
  tags: ["autodocs"],
  render: (args) => (
    <div data-testid="emptystatecontainer-storybook-ui-container">
      <EmptyContainer {...args} />
    </div>
  ),
} satisfies Meta<TEmptyStateContainerProps>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultEmptyStateContainer: Story = {
  args: {
    icon: "Failure",
    primaryMessage: "Primary Message about the empty state",
    userMessage: "What should user should do about it?",
    buttonGroupProps: {
      buttons: [
        { buttonType: "primary", children: "Primary", onClick: () => {} },
        { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
        { buttonType: "secondary", children: "Secondary", onClick: () => {} },
      ],
    },
  },
  name: "Default Empty State Container",
};

export const EmptyContainerWithoutButtons: Story = {
  args: {
    icon: "Failure",
    primaryMessage: "Primary Message about the empty state",
    userMessage: "What should user should do about it?",
  },
  name: "Empty Container without buttons",
};

export const EmptyStateContainerOnlyIcon: Story = {
  args: {
    icon: "Failure",
  },
  name: "Empty Container only Icon",
};

export const EmptyStateContainerWithImage: Story = {
  args: {
    imageUrl: Clock,
    height: 250,
    width: 250,
    alt: "img-clock",
    primaryMessage: "Primary Message about the empty state",
    userMessage: "What should user should do about it?",
    buttonGroupProps: {
      buttons: [
        { buttonType: "primary", children: "Primary", onClick: () => {} },
        { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
        { buttonType: "secondary", children: "Secondary", onClick: () => {} },
      ],
    },
  },
  name: "Empty Container with Image",
};
