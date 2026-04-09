import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "murv/test-utils";
import { ExpandMore } from "@murv/icons";
import { Button } from "../src";
import { ButtonSize } from "../src/types";

describe("Button component", () => {
  // Default State Testing
  it("renders with default props", () => {
    const { getByText } = render(<Button>Click me</Button>);
    const buttonElement = getByText("Click me");
    expect(buttonElement).toBeInTheDocument();
  });

  // Disabled State Testing
  it("renders button in disabled state", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(
      <Button disabled onClick={onClickMock}>
        Click me
      </Button>,
    );
    const buttonElement = getByText("Click me");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalledTimes(0);
  });

  // Hover State Testing
  it("renders button in hover state", () => {
    const { getByText } = render(<Button>Click Here</Button>);
    fireEvent.mouseOver(getByText("Click Here"));
  });

  // Loading State Testing
  it("renders button in loading state", () => {
    render(<Button isLoading />);
    const loaderIcons = screen.queryAllByTestId("loader-icon");
    expect(loaderIcons.length).toBeGreaterThan(0);
  });

  // Onclick testing
  it("calls onClick handler when clicked", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(<Button onClick={onClickMock}>Click me</Button>);
    const buttonElement = getByText("Click me");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  // Focused State Testing
  it("renders button in focused state", () => {
    const { getByText } = render(<Button>Click me</Button>);
    fireEvent.focus(getByText("Click me"));
  });

  it("renders button in pressed state", () => {
    const { getByText } = render(<Button>Click me</Button>);
    fireEvent.mouseDown(getByText("Click me"));
  });

  it("renders button with suffix icon", () => {
    const { getByTestId } = render(<Button SuffixIcon={ExpandMore} />);
    expect(getByTestId("dropdown-icon")).toBeInTheDocument();
  });

  it("renders button without icons", () => {
    const { queryByTestId } = render(<Button />);
    expect(queryByTestId("add-icon")).toBeNull();
    expect(queryByTestId("dropdown-icon")).toBeNull();
  });

  it("should have pointer events as none when button is on loading state", () => {
    const { getByTestId } = render(<Button isLoading data-testid="btn-test-id" />);
    const buttonElement = getByTestId("btn-test-id");

    expect(buttonElement).toHaveStyle("pointer-events: none;");
  });
});

describe("Button component snapshots", () => {
  it("matches snapshot with default props", () => {
    const { asFragment } = render(<Button>Click me!!</Button>);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with primary style", () => {
    const { asFragment } = render(<Button buttonType="primary" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with custom size", () => {
    const { asFragment } = render(<Button size={ButtonSize.large}>Large Button</Button>);
    expect(asFragment()).toMatchSnapshot();
  });
});
