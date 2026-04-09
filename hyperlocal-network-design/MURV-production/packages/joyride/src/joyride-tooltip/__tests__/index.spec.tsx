import React from "react";
import { render, screen } from "murv/test-utils";
import Tooltip from "../JoyrideTooltip";
import Mocks from "../index.mock";

describe("Tour Tooltip", () => {
  test("renders correct values as a step", async () => {
    render(
      <Tooltip
        {...Mocks.base}
        step={{
          title: "Title Place",
          content: "Content Place",
          target: ".test",
        }}
      />,
    );
    expect(screen.getByText("Title Place")).toBeInTheDocument();
    expect(screen.getByText("Content Place")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });
  test("renders correct values as last step", async () => {
    render(
      <Tooltip
        {...Mocks.base}
        step={{
          title: "Title Place",
          content: "Content Place",
          target: ".test",
        }}
        isLastStep
      />,
    );
    expect(screen.getByText("Close")).toBeInTheDocument();
  });
  test("renders correct values with skip", async () => {
    render(
      <Tooltip
        {...Mocks.base}
        step={{
          title: "Title Place",
          content: "Content Place",
          target: ".test",
        }}
        showSkipButton
      />,
    );
    expect(screen.getByText("Skip")).toBeInTheDocument();
  });
});
