import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "murv/test-utils";
import { ExpandMore } from "@murv/icons";
import { SwipeableButton } from "../src";

describe("SwipeableButton component", () => {
  // Default State Testing
  it("renders with default props", () => {
    const { getByText } = render(<SwipeableButton>Click me</SwipeableButton>);
    const buttonElement = getByText("Click me");
    expect(buttonElement).toBeInTheDocument();
  });

  // Disabled State Testing
  it("renders button in disabled state", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(
      <SwipeableButton disabled onClick={onClickMock}>
        Click me
      </SwipeableButton>,
    );
    const buttonElement = getByText("Click me");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalledTimes(0);
  });

  // Hover State Testing
  it("renders button in hover state", () => {
    const { getByText } = render(<SwipeableButton>Click Here</SwipeableButton>);
    fireEvent.mouseOver(getByText("Click Here"));
  });

  // Loading State Testing
  it("renders button in loading state", () => {
    render(<SwipeableButton isLoading />);
    const loaderIcons = screen.queryAllByTestId("loader-icon");
    expect(loaderIcons.length).toBeGreaterThan(0);
  });

  // Onclick testing
  it("calls onClick handler when clicked", () => {
    const onClickMock = jest.fn();
    const { getByText } = render(<SwipeableButton onClick={onClickMock}>Click me</SwipeableButton>);
    const buttonElement = getByText("Click me");
    fireEvent.click(buttonElement);
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  // Focused State Testing
  it("renders button in focused state", () => {
    const { getByText } = render(<SwipeableButton>Click me</SwipeableButton>);
    fireEvent.focus(getByText("Click me"));
  });

  it("renders button in pressed state", () => {
    const { getByText } = render(<SwipeableButton>Click me</SwipeableButton>);
    fireEvent.mouseDown(getByText("Click me"));
  });

  it("renders button with suffix icon", () => {
    const { getByTestId } = render(<SwipeableButton SuffixIcon={ExpandMore} />);
    expect(getByTestId("dropdown-icon")).toBeInTheDocument();
  });

  it("renders button without icons", () => {
    const { queryByTestId } = render(<SwipeableButton />);
    expect(queryByTestId("add-icon")).toBeNull();
    expect(queryByTestId("dropdown-icon")).toBeNull();
  });

  it("should have pointer events as none when button is on loading state", () => {
    const { getByTestId } = render(<SwipeableButton isLoading data-testid="btn-test-id" />);
    const buttonElement = getByTestId("btn-test-id");

    expect(buttonElement).toHaveStyle("pointer-events: none;");
  });
  test("triggers onSwipedLeft handler", () => {
    const onSwipedLeftMock = jest.fn();
    const { container } = render(
      <SwipeableButton swipeableProps={{ onSwipedLeft: onSwipedLeftMock }}>
        Swipe me leftsdfsdfsdfsdfsdfsdfsdf
      </SwipeableButton>,
    );
    // Triggering a left swipe gesture
    fireEvent.touchStart(container.firstChild, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(container.firstChild, { touches: [{ clientX: -100, clientY: 0 }] });
    fireEvent.touchEnd(container.firstChild);
    expect(onSwipedLeftMock).toHaveBeenCalledTimes(1);
  });

  test("triggers onSwipedLeft handler", () => {
    const onSwipedRightMock = jest.fn();
    const { container } = render(
      <SwipeableButton swipeableProps={{ onSwipedRight: onSwipedRightMock }}>
        Swipe me rightsdfsdfsdfsdfsdfsdfsdf
      </SwipeableButton>,
    );
    // Triggering a right swipe gesture
    fireEvent.touchStart(container.firstChild, { touches: [{ clientX: 0, clientY: 0 }] });
    fireEvent.touchMove(container.firstChild, { touches: [{ clientX: 100, clientY: 0 }] }); // Increasing clientX
    fireEvent.touchEnd(container.firstChild);
    expect(onSwipedRightMock).toHaveBeenCalledTimes(1);
  });
});

describe("SwipeableButton component snapshots", () => {
  it("matches snapshot with default props", () => {
    const { asFragment } = render(<SwipeableButton>Click me!!</SwipeableButton>);
    expect(asFragment()).toMatchSnapshot();
  });

  it("matches snapshot with primary style", () => {
    const { asFragment } = render(<SwipeableButton buttonType="primary" />);
    expect(asFragment()).toMatchSnapshot();
  });
});
