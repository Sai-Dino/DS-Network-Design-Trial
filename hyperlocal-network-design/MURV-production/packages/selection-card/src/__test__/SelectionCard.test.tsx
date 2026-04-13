import { RenderResult, render, fireEvent } from "test-utils";
import React from "react";
import "@testing-library/jest-dom";
import { SelectionCard } from "../SelectionCard";
import { SelectionCardProps } from "../types";

const defaultProps: SelectionCardProps = {
  children: <div data-testid="children">Test Content</div>,
  onApply: jest.fn(),
  onClear: jest.fn(),
  disableApply: false,
};

describe("SelectionCard", () => {
  let screen: RenderResult;

  test("renders children correctly", () => {
    screen = render(<SelectionCard {...defaultProps} />);
    expect(screen.getByTestId("children")).toBeInTheDocument();
  });

  test("shows both buttons when onApply and onClear are provided", () => {
    screen = render(<SelectionCard {...defaultProps} />);
    expect(screen.getByText("Clear")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  test("does not show Clear button when onClear is not provided", () => {
    const { onClear, ...propsWithoutOnClear } = defaultProps;
    screen = render(<SelectionCard {...propsWithoutOnClear} />);
    expect(screen.queryByText("Clear")).not.toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });

  test("does not show Done button when onApply is not provided", () => {
    const { onApply, ...propsWithoutOnApply } = defaultProps;
    screen = render(<SelectionCard {...propsWithoutOnApply} />);
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  test("disables Done button when disableApply is true", () => {
    screen = render(<SelectionCard {...defaultProps} disableApply />);
    const doneButton = screen.getByText("Done").closest("button");
    expect(doneButton).toBeDisabled();
  });

  test("calls onClear when Clear button is clicked", () => {
    screen = render(<SelectionCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Clear"));
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  test("calls onApply when Done button is clicked", () => {
    screen = render(<SelectionCard {...defaultProps} />);
    fireEvent.click(screen.getByText("Done"));
    expect(defaultProps.onApply).toHaveBeenCalled();
  });
  test("matches snapshot", () => {
    const { asFragment } = render(<SelectionCard {...defaultProps} />);
    expect(asFragment()).toMatchSnapshot();
  });
});
