import { render, RenderResult } from "test-utils";
import React from "react";
import "@testing-library/jest-dom";

import { DropdownTrigger, IDropdownTriggerProps } from "..";

const mockProps: IDropdownTriggerProps = {
  primaryText: "Test Dropdown",
  badgeText: "4",
  disabled: false,
  triggerType: "standAlone",
  withBorder: true,
  renderButtonIcon: undefined,
  maxBadgeWidth: "50px",
  buttonWidth: "150px",
};

const WrappedComponent: React.FC<IDropdownTriggerProps> = (props) => <DropdownTrigger {...props} />;

describe("DropdownTrigger", () => {
  let screen: RenderResult;

  beforeEach(() => {
    screen = render(<WrappedComponent {...mockProps} />);
  });

  test("renders as expected", () => {
    const dropdownTrigger = screen.getByTestId("dropdown-trigger");
    expect(dropdownTrigger).toBeInTheDocument();

    const primaryText = screen.getByText("Test Dropdown");
    expect(primaryText).toBeInTheDocument();

    const badgeText = screen.getByText("4");
    expect(badgeText).toBeInTheDocument();

    const expandMoreIcon = screen.getByTestId("dropdown-trigger").querySelector("svg");
    expect(expandMoreIcon).toBeInTheDocument();
  });

  test("renders custom icon if provided", () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom Icon</div>;
    screen.unmount();
    screen = render(<WrappedComponent {...mockProps} renderButtonIcon={CustomIcon} />);
    const customIcon = screen.getByTestId("custom-icon");
    expect(customIcon).toBeInTheDocument();
  });

  test("is disabled when disabled prop is true", () => {
    screen.unmount();
    screen = render(<WrappedComponent {...mockProps} disabled />);
    const dropdownTrigger = screen.getByTestId("dropdown-trigger");
    expect(dropdownTrigger).toBeDisabled();
  });

  test("matches snapshot", () => {
    expect(screen.asFragment()).toMatchSnapshot();
  });

  test("matches snapshot when disabled", () => {
    screen.unmount();
    screen = render(<WrappedComponent {...mockProps} disabled />);
    expect(screen.asFragment()).toMatchSnapshot();
  });

  test("matches snapshot with custom icon", () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom Icon</div>;
    screen.unmount();
    screen = render(<WrappedComponent {...mockProps} renderButtonIcon={CustomIcon} />);
    expect(screen.asFragment()).toMatchSnapshot();
  });

  afterEach(() => {
    screen.unmount();
  });
});
