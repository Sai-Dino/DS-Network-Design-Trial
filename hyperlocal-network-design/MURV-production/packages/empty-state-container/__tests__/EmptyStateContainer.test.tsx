import React from "react";
import "@testing-library/jest-dom";
import { render, waitFor } from "test-utils";
import { ButtonGroupProps } from "packages/button-group/src";
import { EmptyStateContainer } from "../src/EmptyStateContainer";

const defaultProps = {
  primaryMessage: "Test Message about the empty state",
  userMessage: "What should user should do about it?",
};
const mockButtonGroupProps: ButtonGroupProps = {
  buttons: [
    { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
    { buttonType: "secondary", children: "Secondary", onClick: () => {} },
    { buttonType: "primary", children: "Primary", onClick: () => {} },
  ],
};

describe("empty component", () => {
  it("renders the empty component", () => {
    render(<EmptyStateContainer icon="Failure" {...defaultProps} />);
  });

  it("Default Empty container", async () => {
    const { getByTestId, findByText } = render(
      <EmptyStateContainer
        {...defaultProps}
        icon="Failure"
        buttonGroupProps={mockButtonGroupProps}
      />,
    );
    waitFor(() => expect(getByTestId("empty-container-icon-test-id")).toBeDefined());
    expect(await findByText(/Test Message about the empty state/)).toBeInTheDocument();
    expect(await findByText(/What should user should do about it?/)).toBeInTheDocument();
    expect(await findByText(/Tertiary/)).toBeInTheDocument();
    expect(await findByText(/Secondary/)).toBeInTheDocument();
    expect(await findByText(/Primary/)).toBeInTheDocument();
  });
  it("Empty container with buttons", async () => {
    const { findByText } = render(
      <EmptyStateContainer icon="Failure" {...defaultProps} buttonGroupProps={mockButtonGroupProps} />,
    );
    expect(await findByText(/Test Message about the empty state/)).toBeInTheDocument();
    expect(await findByText(/What should user should do about it?/)).toBeInTheDocument();
    expect(await findByText(/Tertiary/)).toBeInTheDocument();
    expect(await findByText(/Secondary/)).toBeInTheDocument();
    expect(await findByText(/Primary/)).toBeInTheDocument();
  });

  it("Empty container with icon and message", async () => {
    const { getByTestId, findByText } = render(
      <EmptyStateContainer {...defaultProps} icon="Failure" />,
    );
    waitFor(() => expect(getByTestId("empty-container-icon-test-id")).toBeDefined());
    expect(await findByText(/Test Message about the empty state/)).toBeInTheDocument();
    expect(await findByText(/What should user should do about it?/)).toBeInTheDocument();
  });
});




