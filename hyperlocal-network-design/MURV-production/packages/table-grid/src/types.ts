import React, { HTMLAttributes } from "react";
import { CellContext, SortingState } from "@tanstack/react-table";
import { ButtonGroupProps } from "packages/button-group/src/types";

export interface IInfoMessage {
  /** Message to display when table has no data */
  emptyState?: string;
  /** Message to display when an error occurs */
  errorState?: string;
  /** Additional message to provide context or instructions to the user */
  userMessage?: string;
  /** Button group configuration for actions in empty/error states */
  buttonGroupProps?: ButtonGroupProps;
}

export interface TableGridProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Enable sticky header that remains visible when scrolling */
  fixedHeader?: boolean;
  /** Array of data rows to display in the table */
  data: T[];
  /** Column definitions specifying how to render each column */
  columns: ColumnType<T>[];
  /** Custom renderer function for table cells. Receives cell context and returns JSX */
  renderCell?: (data: CellContext<T, unknown>) => JSX.Element | React.ReactNode;
  /** Callback fired when sort state changes. Receives new sorting state */
  onSortChange?: (data: SortingState) => void;
  /** Initial sort state for the table */
  sortQuery?: SortingState;
  /** Callback fired when row selection changes. Receives array of selected row indices */
  onRowSelect: (data: string[]) => void;
  /** Callback fired when hovering over a row. Receives row data and index */
  onRowHover?: (data: T, index: number) => void;
  /** Enable row selection checkboxes in the first column */
  enableRowSelection?: boolean;
  /** Number of columns to fix/freeze on the left side during horizontal scroll */
  numberOfFixedColumns?: number;
  /** Test ID attribute for automated testing */
  dataTestId?: string;
  /** Show loading state with skeleton rows */
  loading?: boolean;
  /** Show error state with error message */
  error?: boolean;
  /** Custom messages for empty and error states */
  infoMessage?: IInfoMessage;
  /** Maximum height of the scrollable table container. Required for virtualization to work properly. Example: "600px" or "calc(100vh - 200px)" */
  maxHeight?: string;
}

export interface ContainerGridProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Enable sticky header that remains visible when scrolling */
  fixedHeader?: boolean;
  /** Array of data rows to display in the table */
  data: T[];
  /** Column definitions specifying how to render each column */
  columns: ColumnType<T>[];
  /** Custom renderer function for table cells. Receives cell context and returns JSX */
  renderCell?: (data: CellContext<T, unknown>) => JSX.Element | React.ReactNode;
  /** Callback fired when sort state changes. Receives new sorting state */
  onSortChange?: (data: SortingState) => void;
  /** Initial sort state for the table */
  sortQuery?: SortingState;
  /** Callback fired when row selection changes. Receives array of selected row indices */
  onRowSelect: (data: string[]) => void;
  /** Callback fired when hovering over a row. Receives row data and index */
  onRowHover?: (data: T, index: number) => void;
  /** Enable row selection checkboxes in the first column */
  enableRowSelection?: boolean;
  /** Number of columns to fix/freeze on the left side during horizontal scroll */
  numberOfFixedColumns?: number;
  /** Test ID attribute for automated testing */
  dataTestId?: string;
  /** Maximum height of the scrollable table container. Required for virtualization to work properly. Example: "600px" or "calc(100vh - 200px)" */
  maxHeight?: CSSStyleDeclaration["maxHeight"];
  /** Show loading state with skeleton rows */
  loading?: boolean;
  /** Show error state with error message */
  error?: boolean;
  /** Custom messages for empty and error states */
  infoMessage?: IInfoMessage;
  /**
   * Minimum number of rows before virtualization is applied.
   * Virtualization only activates when row count exceeds this threshold.
   * Default: 30. Set to 0 to always virtualize.
   */
  virtualizeThreshold?: number;
  /** Estimated row height in pixels for virtualization calculations. Must match actual row height. Default: 40 */
  rowHeight?: number;
  /** Number of extra rows to render above/below viewport to prevent white flash during scrolling. Default: 5 */
  overscan?: number;
}

export interface WindowScrollGridProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Enable sticky header that remains visible when scrolling */
  fixedHeader?: boolean;
  /** Array of data rows to display in the table */
  data: T[];
  /** Column definitions specifying how to render each column */
  columns: ColumnType<T>[];
  /** Custom renderer function for table cells. Receives cell context and returns JSX */
  renderCell?: (data: CellContext<T, unknown>) => JSX.Element | React.ReactNode;
  /** Callback fired when sort state changes. Receives new sorting state */
  onSortChange?: (data: SortingState) => void;
  /** Initial sort state for the table */
  sortQuery?: SortingState;
  /** Callback fired when row selection changes. Receives array of selected row indices */
  onRowSelect: (data: string[]) => void;
  /** Callback fired when hovering over a row. Receives row data and index */
  onRowHover?: (data: T, index: number) => void;
  /** Enable row selection checkboxes in the first column */
  enableRowSelection?: boolean;
  /** Number of columns to fix/freeze on the left side during horizontal scroll */
  numberOfFixedColumns?: number;
  /** Test ID attribute for automated testing */
  dataTestId?: string;
  /** Show loading state with skeleton rows */
  loading?: boolean;
  /** Show error state with error message */
  error?: boolean;
  /** Custom messages for empty and error states */
  infoMessage?: IInfoMessage;
  /**
   * Minimum number of rows before virtualization is applied.
   * Virtualization only activates when row count exceeds this threshold.
   * Default: 30. Set to 0 to always virtualize.
   */
  virtualizeThreshold?: number;
  /** Estimated row height in pixels for virtualization calculations. Must match actual row height. Default: 40 */
  rowHeight?: number;
  /** Number of extra rows to render above/below viewport to prevent white flash during scrolling. Default: 5 */
  overscan?: number;
  /**
   * ID of a custom scroll container to use for window scroll virtualization.
   *
   * **When to use:**
   * - Your app has a fixed layout with a scrollable content section (not the actual window)
   * - In Seller Dashboard, use "content-container" as the scroll element
   * - You want users to scroll anywhere on the page (not just inside the table) for virtualization
   * - You need to avoid nested scrollbars while maintaining page-level scroll behavior
   *
   * **How it works:**
   * The virtualizer will track this container's scroll instead of the actual window,
   * creating a "fake window" effect.
   *
   * **Example use cases:**
   * 1. App shells with scrollable main content area:
   *    ```tsx
   *    <div id="app-content" style={{ height: '100vh', overflow: 'auto' }}>
   *      <WindowScrollGrid scrollElementId="app-content" {...props} />
   *    </div>
   *    ```
   *
   * 2. Seller Dashboard:
   *    ```tsx
   *    <WindowScrollGrid scrollElementId="content-container" {...props} />
   *    ```
   *
   * 3. Modal dialogs with large tables:
   *    ```tsx
   *    <Modal>
   *      <div id="modal-body" style={{ maxHeight: '80vh', overflow: 'auto' }}>
   *        <WindowScrollGrid scrollElementId="modal-body" {...props} />
   *      </div>
   *    </Modal>
   *    ```
   *
   * **Note:** The element must exist in the DOM before WindowScrollGrid renders, otherwise
   * the table will fall back to actual window scrolling with a console warning.
   *
   * @default undefined (uses actual window)
   */
  scrollElementId?: string;
}

interface AccessorColumn<T> {
  type?: "accessor";
  isSortable?: boolean;
  width?: number;
  shouldTruncate?: boolean;
  key: keyof T;
  colSpan?: number;
}

interface GroupedColumn<T> {
  type: "group";
  columnsList?: ColumnType<T>[];
}

export type ColumnType<T> = {
  id: string;
  header: (() => Element) | string;
  textAlignment?: "left" | "right" | "center";
} & (AccessorColumn<T> | GroupedColumn<T>);
