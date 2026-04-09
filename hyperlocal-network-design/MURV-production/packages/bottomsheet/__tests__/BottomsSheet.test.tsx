import React from "react";
import { render, fireEvent } from "murv/test-utils";
import { BottomSheetStory } from "../src/stories";

describe("BottomSheetStory component", () => {
  const commonProps = {
    HeaderProps: {
      titleProps: "Test Title",
    },
    ContentProps: <div>Test Content</div>,
    ActionsProps: <div>Test Actions</div>,
  };

  test("renders with correct title and content when opened", () => {
    const { getByTestId, getByText } = render(<BottomSheetStory {...commonProps} />);
    fireEvent.click(getByTestId("bottomsheet-button"));
    const bottomSheetComponent = getByTestId("bottom-sheet-component");
    expect(bottomSheetComponent).toBeInTheDocument();
    const titleElement = getByTestId("bottom-sheet-title");
    expect(titleElement).toHaveTextContent("Test Title");
    const contentElement = getByTestId("bottom-sheet-content");
    const footerElement = getByTestId("bottom-sheet-footer");
    expect(contentElement).toContainElement(getByText("Test Content"));
    expect(footerElement).toContainElement(getByText("Test Actions"));
  });

  test("closes the bottom sheet when clicking the close icon", () => {
    const { getByTestId, queryByTestId } = render(<BottomSheetStory {...commonProps} />);
    fireEvent.click(getByTestId("bottomsheet-button"));
    expect(getByTestId("bottom-sheet-component")).toBeInTheDocument();
    fireEvent.click(getByTestId("bottomsheet-close-icon-button"));
    expect(queryByTestId("bottom-sheet-component")).toBeNull();
  });
});
