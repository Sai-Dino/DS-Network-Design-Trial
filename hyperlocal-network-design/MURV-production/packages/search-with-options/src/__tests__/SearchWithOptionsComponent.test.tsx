import React from "react";
import { MURVProvider } from "@murv/provider";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/extend-expect";
import { SearchWithOptions } from "../SearchWithOptions";
import { ISearchWithOptionsProps } from "../types";

const mockOnSearch = jest.fn();
const mockOnChange = jest.fn();
const mockOnReset = jest.fn();

const options = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
];

const defaultProps: ISearchWithOptionsProps = {
  searchComponentProps: { initialQuery: "", id: "search with options" },
  value: { searchValue: "", selectedOption: "" },
  onSearch: mockOnSearch,
  onChange: mockOnChange,
  onReset: mockOnReset,
  width: "300px",
  orientation: "static",
  options,
  testId: "search-with-options",
};

const MockComponent = () => (
  <MURVProvider themeVariant="light">
    <SearchWithOptions {...defaultProps} />
  </MURVProvider>
);

describe("SearchWithOptions Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test case 1: snapshot
  // it(" search with options snapshot test for the component", () => {
  //   const { container } = render(<MockComponent />);
  //   expect(container).toMatchSnapshot();
  // });

  // Test case 2: Rendering with options
  test("search with options renders with options", () => {
    const { getByTestId } = render(<MockComponent />);
    expect(getByTestId(defaultProps.testId || "")).toBeInTheDocument();
  });

  // Test case 3: Default selected option
  test("search with options selects first option by default if no value provided", () => {
    const { getAllByText } = render(<MockComponent />);
    expect(getAllByText("Option 1")[0]).toBeInTheDocument();
  });

  // Test case 4: on Reset handler
  test("search with options on Reset handler", () => {
    const { container } = render(<MockComponent />);
    const inputElement = screen.getByPlaceholderText("Search...") as HTMLInputElement;

    fireEvent.change(inputElement, { target: { value: "example" } });
    expect(inputElement.value).toBe("example");
    const resetTrigger = container.querySelector(".clear-icon.trigger") as HTMLElement;

    fireEvent.click(resetTrigger);
    expect(mockOnReset).toHaveBeenCalledTimes(1);
    expect(mockOnReset).toHaveBeenCalledWith({
      searchValue: "",
      selectedOption: "option1",
    });
  });
});
