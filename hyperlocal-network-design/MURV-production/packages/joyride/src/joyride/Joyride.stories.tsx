import React from "react";
import { Meta, StoryFn } from "@storybook/react";

import { BrowserRouter } from "react-router-dom";
import { Joyride } from "..";

export default {
  title: "Components/Joyride",
  component: Joyride,
  argTypes: {},
} satisfies Meta<typeof Joyride>;

const TourGuidConfigMock: Record<string, any> = {
  testing2: {
    showUntil: new Date("12-19-2024"),
    steps: [
      {
        title: "Targeting Body to show it in the center",
        placement: "center",
        content: "",
        // disableBeacon: true,
        target: "body",
      },
      {
        title: "A very long title to check the spacing in tooltip.",
        target: ".my-first-step",
        content: (
          <iframe
            title="mock"
            src="https://giphy.com/embed/DgLsbUL7SG3kI"
            width="340"
            height="340"
            frameBorder="0"
            className="giphy-embed"
            allowFullScreen
          />
        ),
      },
      {
        title: "A very long title to check the spacing in tooltip.",
        target: ".my-other-step",
        content: "Content with Title",
      },
      {
        placementBeacon: "right",
        target: ".my-other-step_1",
        content: "Content without Title",
      },
    ],
  },
  testing: {
    showUntil: new Date("12-19-2024"),
    steps: [
      {
        // placementBeacon: 'right',

        disableBeacon: true,
        target: ".other-step_1",
        content: "Content without Title",
      },
      {
        // placementBeacon: 'right',

        title: "A very long title to check the spacing in tooltip.",
        // disableBeacon: true,
        target: ".first-step",
        content: (
          <>
            <iframe
              title="mock"
              src="https://giphy.com/embed/DgLsbUL7SG3kI"
              width="340"
              height="340"
              frameBorder="0"
              className="giphy-embed"
              allowFullScreen
            />
            <p>Content with gif</p>
          </>
        ),
      },
      {
        // placementBeacon: 'right',

        // disableBeacon: true,
        title: "A very long title to check the spacing in tooltip.",

        target: ".other-step",
        content: "Content with Title",
      },
    ],
  },
};

const BodyContent = () => (
  <>
    <div
      style={{
        boxSizing: "border-box",
        padding: "10px",
        display: "flex",
        gap: "8px",
        justifyContent: "space-between",
      }}
    >
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-first-step..."
        className="first-step"
      />
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-other-step..."
        className="other-step"
      />
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-other-step..."
        className="other-step_1"
      />
    </div>
    <div
      style={{
        boxSizing: "border-box",
        padding: "10px",
        display: "flex",
        gap: "8px",
        justifyContent: "space-between",
      }}
    >
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-first-step..."
        className="my-first-step"
      />
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-other-step..."
        className="my-other-step"
      />
      <input
        style={{ width: "100%" }}
        placeholder="type something in my-other-step..."
        className="my-other-step_1"
      />
    </div>
    <Joyride run continuous showSkipButton steps={TourGuidConfigMock.testing2.steps} />
    <Joyride run continuous showSkipButton steps={TourGuidConfigMock.testing.steps} />
  </>
);

const Template: StoryFn<typeof Joyride> = () => (
  <BrowserRouter>
    <BodyContent />
  </BrowserRouter>
);
export const Base = Template.bind({});
Base.args = {};
