/**
 * Represents the properties required for the pagination component.
 */
export interface IPaginationProps {
  /**
   * The current page number.
   */
  currentPage: number;

  /**
   * The total number of items to be paginated.
   */
  totalItems: number;

  /**
   * A function to be called when the page is changed.
   * @param page The new page number.
   * @param pageSize The number of items to display per page.
   */
  onPageChange?: (page: number, pageSize: number) => void;

  /**
   * The number of items to display per page.
   */
  pageSize: number;
}

export interface IPageSizeSelectorProps {
  options: { label: string; value: number }[];
  selectedPageSize: number;
  onChange: (newPageSize: number) => void;
  name?: string;
}
