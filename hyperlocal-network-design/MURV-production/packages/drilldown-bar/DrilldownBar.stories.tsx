import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DrilldownBar, DrilldownBarComponent } from "./src";
import { DrilldownBarRenderer, StoryExampleProps } from "./StoryRenderer";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Drilldown Bar",
  component: DrilldownBar,
  tags: ["autodocs"],
  argTypes: {
    dataTestId: {
      control: "text",
    },
    id: {
      control: "text",
    },
  },
  args: {
    id: "drilldown-bar-id",
    dataTestId: "drilldown-bar-storybook-ui-container",
  },
} satisfies Meta<DrilldownBarComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const DrilldownBarExample: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleOne} />,
};

export const DrilldownBarSearchFound: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleTwo} />,
};

export const DrilldownBarSearchNotFound: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleThree} />,
};

export const DrilldownBarSearchFoundSome: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleFour} />,
};

export const DrilldownBarSearchFoundMobile: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleFive} />,
};

export const DrilldownBarSearchNotFoundMobile: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleSix} />,
};

export const DrilldownBarSearchFoundSomeMobile: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleSeven} />,
};

export const DrilldownBarWithFiltersAndActions: Story = {
  render: () => <DrilldownBarRenderer {...StoryExampleProps.exampleEight} />,
};
