import React from "react";

import { render, screen } from "murv/test-utils";
import { waitFor } from "@testing-library/react";
import { Joyride } from "../..";

const ElementExists = () => (
  <div>
    <div id="test">Hello</div>
    <Joyride
      run
      steps={[
        {
          title: "Targeting test",
          placement: "auto",
          placementBeacon: "bottom",
          content: "to show it in the bottom",
          target: "#test",
        },
      ]}
    />
  </div>
);

describe("Joyride test", () => {
  test("Renders Joyride component when element is found", async () => {
    render(<ElementExists />);
    await waitFor(async () => {
      expect(await screen.findByText("to show it in the bottom")).toBeInTheDocument();
    });
  });
});
