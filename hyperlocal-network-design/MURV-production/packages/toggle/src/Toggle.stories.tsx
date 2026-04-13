import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from ".";

const meta = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
} satisfies Meta<typeof Toggle>;

export default meta;

type Story = StoryObj<typeof Toggle>;

export const UnControlled: Story = {
  args: {
    id: "toggleSwicthUnControlled",
    label: "Are you ok with T&C",
    description: "This is test",
    onChange: undefined,
    style: {
      width: "300px",
    },
  },
};

export const Controlled: Story = {
  render(props) {
    const [checked, setChecked] = useState(true);

    return <Toggle {...props} checked={checked} onChange={(e) => setChecked(e.target.checked)} />;
  },
  args: {
    id: "toggleSwicthControlled",
    label: "Are you ok with T&C",
    style: {
      width: "300px",
    },
  },
};

export const Disabled: Story = {
  args: {
    id: "toggleSwicthDisabled",
    disabled: true,
    label: "Are you ok with T&C? Yes disabled!",
    onChange: undefined,
    style: {
      width: "300px",
    },
  },
};
