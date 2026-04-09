import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "murv/test-utils";
import { ButtonProps } from "@murv/button/src/types";
import { Add } from "@murv/icons";
import { ButtonGroup } from "../src";

describe("Button component", () => {
  // Default State Testing
  it("renders buttons based on provided array of button props", () => {
    const groupBtns: ButtonProps[] = [
      { PrefixIcon: Add, buttonType: "tertiary", buttonStyle: "brand" },
      { buttonType: "tertiary", buttonStyle: "brand", children: "Click Me!!" },
    ];
    render(<ButtonGroup buttons={groupBtns} />);
    const renderedButtons = screen.getAllByRole("button");
    expect(renderedButtons.length).toBe(2);
    expect(renderedButtons[1]).toHaveTextContent("Click Me!!");
  });

  it("handles onClick, disabled, and loading states", async () => {
    const mockOnClick = jest.fn();
    const { container } = render(
      <ButtonGroup
        buttons={[
          {
            PrefixIcon: Add,
            buttonType: "tertiary",
            className: "tert-btn",
            buttonStyle: "brand",
            onClick: mockOnClick,
          },
          {
            buttonType: "tertiary",
            className: "disabled-btn",
            buttonStyle: "brand",
            onClick: mockOnClick,
            children: "Click Me!!",
            disabled: true,
          },
          {
            buttonType: "primary",
            className: "load-btn",
            buttonStyle: "brand",
            children: "Loading...",
            isLoading: true,
          },
        ]}
      />,
    );

    // Test onClick
    const clickableButton = container.querySelector(".tert-btn");
    fireEvent.click(clickableButton);
    expect(mockOnClick).toHaveBeenCalledTimes(1);

    // Test disabled state
    const disabledButton = container.querySelector(".disabled-btn");
    fireEvent.click(disabledButton);
    expect(disabledButton).toHaveStyle("cursor: not-allowed;");

    // Test loading state
    const loadingButton = container.querySelector(".load-btn");
    expect(loadingButton).toHaveStyle("pointer-events: none;");
  });
});

describe("ButtonGroup component snapshots", () => {
  it("matches snapshot with default props", () => {
    const { asFragment } = render(
      <ButtonGroup
        buttons={[
          { PrefixIcon: Add, buttonType: "tertiary", buttonStyle: "brand" },
          { PrefixIcon: Add, buttonType: "tertiary", buttonStyle: "brand" },
        ]}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
