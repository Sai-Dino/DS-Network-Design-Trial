import { fireEvent, render, screen } from "test-utils";
import React from "react";

import { Search } from "../Search";

describe("Search component default", () => {
  test("renders with default props", () => {
    const searchComponent = render(<Search id="search1" />);
    expect(searchComponent).toMatchSnapshot();
  });

  test("renders with default props", () => {
    render(<Search id="search1" />);
    const searchInput = screen.getByPlaceholderText("Search...");
    expect(searchInput).toBeInTheDocument();
  });

  test("search icon is displayed", () => {
    const { container } = render(<Search id="search1" />);
    const searchIcons = container.querySelectorAll(".search-icon.trigger");
    expect(searchIcons).toHaveLength(1);
  });

  test("clear icon is not displayed by default", () => {
    const { container } = render(<Search id="search1" />);
    const searchIcons = container.querySelectorAll(".clear-icon.trigger");
    expect(searchIcons).toHaveLength(0);
  });

  test("handles focus and blur events", () => {
    const searchComponent = render(<Search id="search1" />);
    const searchInput = screen.getByPlaceholderText("Search...");

    fireEvent.focus(searchInput);
    expect(searchComponent).toMatchSnapshot();

    fireEvent.blur(searchInput);
    expect(searchComponent).toMatchSnapshot();
  });
});

describe("Search component handlers", () => {
  test("on search handler", () => {
    const onSearchMock = jest.fn();
    const { container } = render(<Search id="search1" onSearch={onSearchMock} />);
    const inputElement = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    const searchTrigger = container.querySelector(".search-icon.trigger") as HTMLElement;
    fireEvent.change(inputElement, { target: { value: "example" } });
    expect(inputElement.value).toBe("example");

    fireEvent.click(searchTrigger);
    expect(onSearchMock).toHaveBeenCalledTimes(1);
    expect(onSearchMock).toHaveBeenCalledWith("example", "search1");
  });

  test("on clear handler", () => {
    const onClearMock = jest.fn();
    const { container } = render(<Search id="search1" onClear={onClearMock} />);
    const inputElement = screen.getByPlaceholderText("Search...") as HTMLInputElement;
    fireEvent.change(inputElement, { target: { value: "example" } });
    expect(inputElement.value).toBe("example");

    const clearTrigger = container.querySelector(".clear-icon.trigger") as HTMLElement;
    fireEvent.click(clearTrigger);
    expect(onClearMock).toHaveBeenCalledTimes(1);
    expect(onClearMock).toHaveBeenCalledWith("search1");
  });
});

describe("Search component variants", () => {
  test("supports showPrefixIcon (prefixIcon=true) without errors", () => {
    const { container } = render(
      <Search id="search-prefix" prefixIcon alwaysShowCloseIcon initialQuery="abc" />,
    );
    // Prefix search icon wrapper should be present in DOM
    const prefixIcon = container.querySelector(".search-icon.icon");
    expect(prefixIcon).toBeTruthy();
    // Trigger search icon and separator are rendered in DOM; visibility is CSS-driven
    const triggerIcon = container.querySelector(".search-icon.trigger");
    const separatorIcon = container.querySelector(".separator-icon");
    expect(triggerIcon).toBeTruthy();
    expect(separatorIcon).toBeTruthy();
  });

  test("renders custom suffix via renderSuffix", () => {
    const { container, getByText } = render(
      <Search id="search-suffix" renderSuffix={() => <div>Custom Suffix</div>} />,
    );
    // Suffix container should exist and render the provided content
    const suffixContainer = container.querySelector(".suffix-container");
    expect(suffixContainer).toBeTruthy();
    expect(getByText("Custom Suffix")).toBeInTheDocument();
  });
});
