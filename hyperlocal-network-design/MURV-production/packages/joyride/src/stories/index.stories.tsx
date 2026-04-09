import React from "react";
import { StoryFn } from "@storybook/react";
import { Switch, MemoryRouter } from "react-router-dom";
import { DemoPageWithCustomCallback as DemoPageWithCallback } from "./DemoPageWithCallback";

export default {
  title: "Components/Joyride/MultiRouteTourGuide",
  component: DemoPageWithCallback,
  argTypes: {},
};

const Template2: StoryFn<typeof DemoPageWithCallback> = () => (
  <MemoryRouter initialEntries={["/"]}>
    <Switch>
      <DemoPageWithCallback />
    </Switch>
  </MemoryRouter>
);

export const MultiRouteWithCustomCallback = Template2.bind({});
MultiRouteWithCustomCallback.args = {};
