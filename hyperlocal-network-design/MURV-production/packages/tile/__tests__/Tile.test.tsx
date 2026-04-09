import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, waitFor } from "test-utils";
import { Tile } from "../src/Tile";

describe("Tile Component", () => {
  it("Render Default Props", () => {
    const { getByText } = render(<Tile.SimpleTile label="Hello" />);
    const ele = getByText("Hello");
    expect(ele).toBeInTheDocument();
  });

  it("Render Hover State when not selected", async () => {
    const { getByTestId } = render(<Tile.SimpleTile testId="simple-tile" label="Hello" />);
    const ele = getByTestId("simple-tile");
    await waitFor(() => {
      const computedStyle = window.getComputedStyle(ele);
      const bgColor = computedStyle.backgroundColor;
      expect(["rgb(255, 255, 255)", "rgb(245, 245, 245)"]).toContain(bgColor);
    });
    fireEvent.mouseEnter(ele);
  });

  it("Render Hover State when selected", async () => {
    const { getByTestId } = render(<Tile.SimpleTile label="Hello" testId="simple-tile" selected />);
    const ele = getByTestId("simple-tile");
    await waitFor(() => {
      const computedStyle = window.getComputedStyle(ele);
      const bgColor = computedStyle.backgroundColor;
      expect(["rgb(240, 245, 255)", "rgb(171, 200, 255)"]).toContain(bgColor);
    });
    fireEvent.mouseEnter(ele);
  });

  it("Render Suffix Icon After Header when Not selected", async () => {
    const { getByTestId, getByText } = render(
      <Tile.TileWithIcon
        label="Label"
        heading="Heading"
        infoText="Lorem Ipsum"
        description="Description"
        testId="icon-tile"
        selected
      />,
    );
    const ele = getByTestId("icon-tile");
    fireEvent.mouseEnter(ele);

    await waitFor(() => {
      expect(getByText("Heading")).toBeInTheDocument();
      expect(getByText("Description")).toBeInTheDocument();
      expect(getByText("Label")).toBeInTheDocument();
    });
  });
  it("Render Disabled State when Tile Disabled", async () => {
    const { getByTestId } = render(
      <Tile.TileWithIcon
        testId="disable-tile-test"
        selected={false}
        disabled
        label="Hello"
        heading="Heading"
        description="Description"
        infoText="Lorem Ipsum"
      />,
    );

    const ele = getByTestId("disable-tile-test");
    expect(ele).toHaveStyle({
      background: "rgb(250, 250, 250)",
      border: "2px solid #f5f5f5",
    });
  });

  it("Click & Hover Function should not trigger when disabled", async () => {
    const mockHoverFn = jest.fn();
    const { getByTestId } = render(
      <Tile.TileWithIcon
        testId="pressed-tile-test"
        selected={false}
        disabled
        label="Hello"
        heading="Heading"
        description="Description"
        infoText="Lorem Ipsum"
        onClick={mockHoverFn}
      />,
    );
    const ele = getByTestId("pressed-tile-test");
    fireEvent.click(ele);
    expect(getComputedStyle(ele).pointerEvents).toBe("none");
  });

  it("Click & Hover Function should trigger", async () => {
    const mockHoverFn = jest.fn();
    const mockClickFn = jest.fn();
    const { getByTestId } = render(
      <Tile.TileWithIcon
        testId="pressed-tile-test"
        selected={false}
        disabled
        label="Hello"
        heading="Heading"
        description="Description"
        infoText="Lorem Ipsum"
        onHover={mockHoverFn}
        onClick={mockClickFn}
      />,
    );
    const ele = getByTestId("pressed-tile-test");
    fireEvent.click(ele);
    fireEvent.mouseEnter(ele);
    await waitFor(() => {
      expect(mockHoverFn).toHaveBeenCalledTimes(1);
      expect(mockClickFn).toHaveBeenCalledTimes(1);
    });
  });

  it("matches snapshot with selected style", () => {
    const { asFragment } = render(
      <Tile.TileWithIcon
        testId="snapshot-tile-test"
        selected
        disabled={false}
        label="Hello"
        heading="Heading"
        description="Description"
        infoText="Lorem Ipsum"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with disabled style", () => {
    const { asFragment } = render(
      <Tile.TileWithIcon
        testId="snapshot-tile-test"
        selected={false}
        disabled
        label="Hello"
        heading="Heading"
        description="Description"
        infoText="Lorem Ipsum"
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with selected style click", () => {
    const { asFragment, getByTestId } = render(
      <Tile.TileWithIcon
        testId="snapshot-tile-test"
        selected
        disabled={false}
        label="Hello"
        heading="Heading"
        description="Description"
        onClick={() => {}}
        infoText="Lorem Ipsum"
      />,
    );
    fireEvent.click(getByTestId("snapshot-tile-test"));
    expect(asFragment()).toMatchSnapshot();
  });
});
