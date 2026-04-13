import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./RadioGroup";

const meta = {
  title: "Components/Radio",
  component: RadioGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const UnControlled: Story = {
  args: {
    orientation: 'vertical',
    options: [
      { label: "Apple", value: "apple", description: "keeps away from doctor!" },
      {
        label: "Orange",
        value: "orange",
        description: "Vitamic C",
        inputProps: {
          defaultChecked: true,
        },
      },
    ],
    name: "fruit",
    onChange: undefined,
  },
};

export const Controlled: Story = {
  render(props) {
    const [value, setValue] = useState("cycle");

    return <RadioGroup {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
  },
  args: {
    options: [
      {
        label: "Cycle",
        value: "cycle",
      },
      { label: "Bike", value: "bike" },
      {
        label: "Car",
        value: "car",
        disabled: true,
      },
    ],
    name: "vehicle",
    radioPosition: "right",
    style: {
      width: "300px",
    },
  },
};
