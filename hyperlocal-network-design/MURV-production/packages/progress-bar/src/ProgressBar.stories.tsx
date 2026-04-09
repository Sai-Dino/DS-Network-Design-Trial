import React, { ReactElement, useState } from "react";
import { StoryObj, Meta } from "@storybook/react";
import { ProgressBar, PROGRESS_BAR_VARIANTS } from "./index";
import { TProgressBar } from "./types";

interface ProgressProps {
  render: (value: number) => ReactElement;
}
const Progress: React.FC<ProgressProps> = ({ render }) => {
  const [progressValue, setProgressValue] = useState(95);
  if (progressValue < 100) {
    setTimeout(() => setProgressValue(progressValue + 1), 1000);
  }

  return <>{render(progressValue)}</>;
};

const meta = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  argTypes: {
    variant: {
      description: "Pass the variant of progress bar.",
      defaultValue: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    },
    value: {
      description:
        "Value of the progress. If the value is greater than max value then value will be replaced max value.",
      defaultValue: 0,
    },
    label: {
      description: "Text for the progress bar.",
      defaultValue: "Progress so far...",
    },
    max: {
      description:
        "The max prop is only required for the manual variant. For the systematic variant, it is fixed at 100, which is also the default value for the manual variant.",
      defaultValue: 100,
    },
    dataTestId: {
      description: "The test Id for test",
      defaultValue: "default-systematic-progress-bar",
    },
  },
  args: {
    variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    value: 20,
    label: "Downloading...",
    dataTestId: "default-systematic-progress-bar",
  },
  tags: ["autodocs"],
  render: (args) => (
    <div data-testid="progressbar-storybook-ui-container">
      <ProgressBar {...args} />
    </div>
  ),
} satisfies Meta<TProgressBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultSystematicProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    label: "Downloading ...",
    value: 40,
    dataTestId: "default-systematic-progress-bar",
  },
  name: "Default Systematic Progress Bar",
};
export const AutomaticProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    label: "Downloading ...",
    dataTestId: "automatic-systematic-progress-bar",
  },
  render: (args) => <Progress render={(value) => <ProgressBar {...args} value={value} />} />,
  name: "Automatic Progress Bar",
};
export const minSystematicProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    label: "Downloading ...",
    dataTestId: "min-systematic-progress-bar",
    value: 0,
  },
  name: "Minimum Systematic Progress Bar",
};
export const maxSystematicProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.SYSTEMATIC,
    label: "Downloaded",
    dataTestId: "min-systematic-progress-bar",
    value: 100,
  },
  name: "Maximum Systematic Progress Bar",
};
export const DefaultManualProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.MANUAL,
    value: 4,
    label: "Steps",
    dataTestId: "default-manual-progress-bar",
    max: 10,
  },
  name: "Default Manual Progress Bar",
};
export const minManualProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.MANUAL,
    value: 0,
    label: "Steps",
    dataTestId: "min-manual-progress-bar",
    max: 10,
  },
  name: "Minimum Manual Progress Bar",
};

export const maxManualProgressBar: Story = {
  args: {
    variant: PROGRESS_BAR_VARIANTS.MANUAL,
    value: 10,
    label: "Steps",
    dataTestId: "min-manual-progress-bar",
    max: 10,
  },
  name: "Maximum Manual Progress Bar",
};
