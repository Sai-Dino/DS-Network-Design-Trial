import React from "react";
import "@testing-library/jest-dom";
import { render, fireEvent, screen } from "@murv/test-utils";
import { Pagination } from "..";

// Mock the onPageChange function
const mockOnPageChange = jest.fn();

test("renders pagination with correct page numbers", () => {
  render(
    <Pagination currentPage={1} totalItems={20} onPageChange={mockOnPageChange} pageSize={5} />,
  );

  // Check if all expected page numbers are rendered
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
  expect(screen.getByText("4")).toBeInTheDocument();

  // Snapshot testing
  const paginationContainer = screen.getByTestId("pagination-container");
  expect(paginationContainer).toMatchSnapshot();
});

test("calls onPageChange with correct page number when a page button is clicked", () => {
  render(
    <Pagination currentPage={1} totalItems={20} onPageChange={mockOnPageChange} pageSize={5} />,
  );

  // Click on page 2 button
  fireEvent.click(screen.getByTestId("page-2"));
  expect(mockOnPageChange).toHaveBeenCalledWith(2, 5);
});

test("disables previous button when on first page", () => {
  render(
    <Pagination currentPage={1} totalItems={20} onPageChange={mockOnPageChange} pageSize={5} />,
  );
  const prevButton = screen.getByTestId("prev-page-button");

  // Check if the previous button is disabled
  expect(prevButton).toBeDisabled();
});

test("disables next button when on last page", () => {
  render(
    <Pagination currentPage={4} totalItems={20} onPageChange={mockOnPageChange} pageSize={5} />,
  );

  // Next button should be disabled
  const nextButton = screen.getByTestId("next-page-button");

  // Check if the previous button is disabled
  expect(nextButton).toBeDisabled();
});
