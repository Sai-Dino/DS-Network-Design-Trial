import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent } from "test-utils";
import { Pill } from "../src/Pill";

describe("PillSmall Component", () => {
  it("renders with default props", () => {
    const { getByText } = render(
      <Pill.PillSmall label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(getByText("Test Label")).toBeInTheDocument();
  });
  it("snapshot test for PillSmall component", () => {
    const { container } = render(
      <Pill.PillSmall label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(container).toMatchSnapshot();
  });
  it("renders with selected true", () => {
    const { getByTestId } = render(
      <Pill.PillSmall
        label="Test Label"
        selected
        tabIndex={0}
        testId="pills-small"
        value="test_value"
      />,
    );
    expect(getByTestId("pills-small")).toHaveAttribute("aria-selected", "true");
  });

  it("renders with disabled true", () => {
    const { getByTestId } = render(
      <Pill.PillSmall
        label="Test Label"
        disabled
        tabIndex={0}
        testId="pills-small"
        value="test_value"
      />,
    );
    expect(getByTestId("pills-small")).toHaveAttribute("aria-disabled", "true");
  });

  it("handles click event", () => {
    const handleClick = jest.fn();
    const { getByTestId } = render(
      <Pill.PillSmall
        label="Test Label"
        onClick={handleClick}
        tabIndex={0}
        testId="pills-small"
        value="test_value"
      />,
    );
    fireEvent.click(getByTestId("pills-small"));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe("PillMedium Component", () => {
  it("renders with default props", () => {
    const { getByText } = render(
      <Pill.PillMedium label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(getByText("Test Label")).toBeInTheDocument();
  });

  it("handles onHover event", () => {
    const handleHover = jest.fn();
    const { getByTestId } = render(
      <Pill.PillMedium
        label="Test Label"
        onHover={handleHover}
        tabIndex={0}
        testId="pills-medium"
        value="test_value"
      />,
    );
    fireEvent.mouseEnter(getByTestId("pills-medium"));
    expect(handleHover).toHaveBeenCalled();
  });

  it("handles focus event", () => {
    const handleFocus = jest.fn();
    const { getByTestId } = render(
      <Pill.PillMedium
        label="Test Label"
        onFocus={handleFocus}
        tabIndex={0}
        testId="pills-medium"
        value="test_value"
      />,
    );
    fireEvent.focus(getByTestId("pills-medium"));
    expect(handleFocus).toHaveBeenCalled();
  });
});

describe("PillLarge Component", () => {
  it("renders with default props", () => {
    const { getByText } = render(
      <Pill.PillLarge label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(getByText("Test Label")).toBeInTheDocument();
  });

  it("handles suffix icon callback", () => {
    const handleSuffixIconClick = jest.fn();
    const { getByTestId } = render(
      <Pill.PillLarge
        label="Test Label"
        suffixIconCallBack={handleSuffixIconClick}
        tabIndex={0}
        suffixIcon="add"
        value="test_value"
      />,
    );
    fireEvent.click(getByTestId("suffix-icon"));
    expect(handleSuffixIconClick).toHaveBeenCalled();
  });

  it("handles click event", () => {
    const handleClick = jest.fn();
    const { getByTestId } = render(
      <Pill.PillLarge
        label="Test Label"
        onClick={handleClick}
        tabIndex={0}
        testId="pills-large"
        value="test_value"
      />,
    );
    fireEvent.click(getByTestId("pills-large"));
    expect(handleClick).toHaveBeenCalled();
  });
  it("snapshot test for PillMedium component", () => {
    const { container } = render(
      <Pill.PillMedium label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(container).toMatchSnapshot();
  });

  it("snapshot test for PillLarge component", () => {
    const { container } = render(
      <Pill.PillLarge label="Test Label" tabIndex={0} value="test_value" />,
    );
    expect(container).toMatchSnapshot();
  });
  it("snapshot test for PillSmall component with selected true", () => {
    const { container } = render(
      <Pill.PillSmall label="Test Label" tabIndex={0} selected value="test_value" />,
    );
    expect(container).toMatchSnapshot();
  });
});
