import { StoryObj, Meta } from "@storybook/react";
import { Label } from "./Label";

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const LabelStory: Story = {
  args: {
    label: "label 1",
    htmlFor: "label1",
    testId: "label1",
  },
};

export const DisabledLabelStory: Story = {
  args: {
    label: "label 2",
    htmlFor: "label2",
    testId: "label2",
    disabled: true,
  },
};

export const RTLLabelStory: Story = {
  args: {
    label: "label 3",
    htmlFor: "label3",
    testId: "label3",
    rtl: true,
  },
};

export const LabelWithDescriptionStory: Story = {
  args: {
    label: "label 4",
    htmlFor: "label4",
    testId: "label4",
    description: "Sample Description",
  },
};

export const DisabledLabelWithDescriptionStory: Story = {
  args: {
    label: "label 5",
    htmlFor: "label5",
    testId: "label5",
    description: "Sample Description",
    disabled: true,
  },
};

export const RTLLabelWithDescriptionStory: Story = {
  args: {
    label: "label 6",
    htmlFor: "label6",
    testId: "label6",
    description: "Sample Description",
    rtl: true,
  },
};

export const LabelWithDescriptionAndDisabledStory: Story = {
  args: {
    label: "label 7",
    htmlFor: "label7",
    testId: "label7",
    description: "Sample Description",
    disabled: true,
  },
};
