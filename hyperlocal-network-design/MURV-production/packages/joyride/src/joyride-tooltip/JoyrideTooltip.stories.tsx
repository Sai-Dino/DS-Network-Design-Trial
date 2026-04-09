import { Meta, StoryFn } from "@storybook/react";

import React from "react";
import { JoyrideTooltip } from "./JoyrideTooltip";
import mockData from "./index.mock";

export default {
  title: "Components/Joyride/JoyrideTooltip",
  component: JoyrideTooltip,
  argTypes: {},
  tags: ["autodocs"],
} as Meta<typeof JoyrideTooltip>;

const Template: StoryFn<typeof JoyrideTooltip> = (args) => (
  <div style={{ width: "fit-content" }}>
    <JoyrideTooltip {...args} data-testId="JoyrideContainer-storybook-ui-container" />
  </div>
);

export const Base = Template.bind({});
export const WithReactElement = Template.bind({});
export const WithoutTitle = Template.bind({});

Base.args = { ...mockData.base };
WithoutTitle.args = { ...mockData.withOutTitle };
WithReactElement.args = {
  ...mockData.withGif,
  step: {
    title: "Title Place",
    content: (
      <>
        <iframe
          title="mock"
          src="https://giphy.com/embed/DgLsbUL7SG3kI"
          width="300"
          height="300"
          frameBorder="0"
          className="giphy-embed"
          allowFullScreen
        />
        <p>Content with gif</p>
      </>
    ),
    target: ".test",
    hideFooter: false,
  },
};
