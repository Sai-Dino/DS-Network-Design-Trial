import React from "react";

export const TourMockData: Record<string, any> = {
  multiRoute: {
    steps: [
      {
        title: "Targeting storybook-page-loged-in",
        placement: "bottom",
        placementBeacon: "bottom",
        content: "to show it in the bottom",
        target: ".storybook-page-loged-in",
        waitForElement: true,
      },
      {
        title: "Done or the day",
        placement: "left",
        placementBeacon: "left",
        content: <>Done or the day</>,
        target: ".logout",
      },
      {
        title: "Targeting storybook-page-loged-out",
        placement: "bottom",
        placementBeacon: "bottom",
        content: "to show it in the bottom",
        target: ".storybook-page-loged-out",
        waitForElement: true,
      },
    ],
  },
  bodyTest: {
    showUntil: new Date("12-19-2024"),
    steps: [
      {
        title: "Body Text",
        content: "Ran after multi route",
        target: "body",
        placement: "center",
        disableBeacon: true,
      },
    ],
  },
};
