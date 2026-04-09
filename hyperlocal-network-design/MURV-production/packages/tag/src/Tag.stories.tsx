import type { Meta, StoryObj } from "@storybook/react";
import { Tag, TagProps } from "./index";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Tag",
  component: Tag,
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<TagProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const TagExample: Story = {
  args: {
    tagText: "New",
    alignment: "regular",
    tagStyle: "red"
  },
  parameters: {},
};
