import React from "react";
import "@testing-library/jest-dom";
import { render } from "murv/test-utils";
import TileBar from "@murv/tilebar";

describe("TileBar", () => {
  const defaultProps = {
    tiles: [
      {
        id: "1",
        label: "Label1",
        heading: "Heading1",
        description: "Description1",
        selected: false,
        disabled: true,
        testId: "1",
      },
      {
        id: "2",
        label: "Label2",
        heading: "Heading2",
        description: "Description2",
        selected: false,
        disabled: false,
        testId: "2",
      },
      {
        id: "3",
        label: "Label3",
        heading: "Heading3",
        description: "Description3",
        selected: true,
        disabled: false,
        testId: "3",
      },
    ],
  };

  test("renders the title correctly", () => {
    render(<TileBar {...defaultProps} />);
  });

  test("renders the subtitle correctly", () => {
    render(<TileBar {...defaultProps} onClick={() => {}} />);
  });

  test("renders the image correctly", () => {
    render(<TileBar {...defaultProps} />);
  });
});
