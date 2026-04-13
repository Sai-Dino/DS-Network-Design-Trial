import React from "react";
import type { StoryObj, Meta } from "@storybook/react";
import { SelectionCard } from ".";

const meta = {
  title: "Components/SelectionCard",
  component: SelectionCard,
  tags: ["autodocs"],
} satisfies Meta<typeof SelectionCard>;

export default meta;

type Story = StoryObj<typeof SelectionCard>;

export const SelectionCardBasic: Story = {
  render(props) {
    return (
      <SelectionCard {...props}>
        <div> Render any children inside</div>
      </SelectionCard>
    );
  },
  args: {
    onApply: () => {
      console.log("applied clicked");
    },
    onClear: () => {
      console.log("cleared clicked");
    },
  },
};
