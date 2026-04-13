import React from "react";
import { screen, fireEvent, render } from "test-utils";
import "@testing-library/jest-dom";
import SearchFeedback from "../src/SearchFeedback";

describe("SearchFeedback Component", () => {
  const mockProps = {
    totalItemCount: 2,
    foundItemCount: 1,
    foundItems: ["Item1"],
    notFoundItemCount: 1,
    notFoundItems: ["Item3"],
    actionLabel: "Copy",
    onReset: jest.fn(),
  };
  const CopyTestProps = {
    ...mockProps,
    totalItemCount: 10,
    foundItemCount: 5,
    foundItems: ["Item1", "Item2"],
    notFoundItemCount: 3,
    notFoundItems: ["Item3", "Item4", "Item5"],
  };

  test("renders without crashing", () => {
    render(<SearchFeedback {...mockProps} />);
  });

  test("displays correct found message", () => {
    render(<SearchFeedback {...mockProps} />);
    expect(screen.getByText("Showing results for Item1")).toBeInTheDocument();
  });

  test("displays correct not found message", () => {
    render(<SearchFeedback {...mockProps} />);
    expect(screen.getByText("No Results found for Item3")).toBeInTheDocument();
  });

  test("displays correct mixed message", () => {
    render(<SearchFeedback {...CopyTestProps} />);
    expect(screen.getByTestId("found-message")).toBeInTheDocument();
    expect(screen.getByTestId("not-found-message")).toBeInTheDocument();
  });

  test("calls onReset when reset button is clicked", () => {
    render(<SearchFeedback {...mockProps} />);
    fireEvent.click(screen.getByText("Reset"));
    expect(mockProps.onReset).toHaveBeenCalledTimes(1);
  });

  test("copies to clipboard when Copy button is clicked", async () => {
    render(<SearchFeedback {...CopyTestProps} />);
    const writeTextMock = jest.fn();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: writeTextMock,
      },
      configurable: true,
    });

    fireEvent.click(screen.getByText("Copy"));
    expect(writeTextMock).toHaveBeenCalledWith("Item3, Item4, Item5");
  });

  test("does not render Copy button when notFoundItems length is less than 2", () => {
    const propsWithSingleNotFoundItem = { ...mockProps, notFoundItems: ["Item3,Item4"] };
    render(<SearchFeedback {...propsWithSingleNotFoundItem} />);
    expect(screen.queryByText("Copy")).not.toBeInTheDocument();
  });

  test("displays the correct actionLabel on the Copy button", () => {
    render(<SearchFeedback {...CopyTestProps} />);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });
});
