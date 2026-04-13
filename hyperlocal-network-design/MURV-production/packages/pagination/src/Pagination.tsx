import React, { useState, useEffect, useMemo } from "react";
import { useMURVContext } from "@murv/provider";
import { ChevronLeft, ChevronRight, MoreHoriz } from "@murv/icons";
import {
  PaginationSelectContainer,
  PageNumberContainer,
  UnitButton,
  PaginatorContainer,
  PageSelectorContainer,
} from "./styles";
import { IPaginationProps, IPageSizeSelectorProps } from "./types";
import PageSizeSelector from "./PageSizeSelector";

export const Pagination: React.FC<IPaginationProps & Partial<IPageSizeSelectorProps>> = ({
  currentPage,
  totalItems = 0,
  onPageChange,
  pageSize = 10,
  options,
  onChange,
  name = "page-selector",
}) => {
  const [currentPageState, setCurrentPageState] = useState<number>(currentPage);
  const { theme } = useMURVContext();

  const totalPages = useMemo(() => Math.ceil(totalItems / pageSize), [totalItems, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageState(1);
      if (onPageChange) {
        onPageChange(1, pageSize);
      }
    }
  }, [totalItems, pageSize, currentPage, onPageChange, totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPageState(page);
    if (onPageChange) {
      onPageChange(page, pageSize);
    }
  };

  const handlePrevPage = () => {
    if (currentPageState > 1) {
      setCurrentPageState(currentPageState - 1);
      if (onPageChange) {
        onPageChange(currentPageState - 1, pageSize);
      }
    }
  };

  const handleNextPage = () => {
    if (currentPageState < totalPages) {
      setCurrentPageState(currentPageState + 1);
      if (onPageChange) {
        onPageChange(currentPageState + 1, pageSize);
      }
    }
  };

  const getPageNumbers = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pageNumbers = [];
    if (currentPageState < 4) {
      for (let i = 1; i <= 5; i += 1) {
        pageNumbers.push(i);
      }
      pageNumbers.push("ellipsis-end");
      pageNumbers.push(totalPages);
    } else if (currentPageState > totalPages - 3) {
      pageNumbers.push(1);
      pageNumbers.push("ellipsis-start");
      for (let i = totalPages - 4; i <= totalPages; i += 1) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      pageNumbers.push("ellipsis-start");
      for (let i = currentPageState - 1; i <= currentPageState + 1; i += 1) {
        pageNumbers.push(i);
      }
      pageNumbers.push("ellipsis-end");
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  }, [totalPages, currentPageState]);

  const handlePageSizeChange = (newPageSize: number) => {
    if (onChange) {
      setCurrentPageState(1);
      onChange(newPageSize);
    }
  };

  return (
    <PaginationSelectContainer data-testid="pagination-container">
      <PaginatorContainer>
        <UnitButton
          selected={false}
          onClick={handlePrevPage}
          disabled={currentPageState === 1}
          aria-label="Previous Page"
          data-testid="prev-page-button"
          className="prev-page-button"
        >
          <ChevronLeft
            color={
              currentPageState === 1 ? theme.color.text.disabled : theme.color.surface.brand.default
            }
          />
        </UnitButton>
        <PageNumberContainer>
          {getPageNumbers.map((item: string | number) => {
            if (typeof item === "number") {
              return (
                <UnitButton
                  key={`page-${item}`}
                  selected={item === currentPageState}
                  onClick={() => handlePageChange(item)}
                  data-testid={`page-${item}`}
                  className="next-page-button"
                >
                  {item}
                </UnitButton>
              );
            }
            return <MoreHoriz key={`ellipsis-${item}`} />;
          })}
          <UnitButton
            selected={false}
            onClick={handleNextPage}
            disabled={currentPageState === totalPages}
            aria-label="Next Page"
            data-testid="next-page-button"
          >
            <ChevronRight
              color={
                currentPageState === totalPages
                  ? theme.color.text.disabled
                  : theme.color.surface.brand.default
              }
            />
          </UnitButton>
        </PageNumberContainer>
      </PaginatorContainer>
      {options && (
        <PageSelectorContainer>
          <PageSizeSelector
            options={options}
            selectedPageSize={pageSize}
            onChange={handlePageSizeChange}
            name={name}
          />
        </PageSelectorContainer>
      )}
    </PaginationSelectContainer>
  );
};
