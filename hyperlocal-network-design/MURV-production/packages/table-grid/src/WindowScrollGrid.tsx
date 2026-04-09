import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
  ColumnDef,
  Table,
  Row,
  CellContext,
  Updater,
  Header,
} from "@tanstack/react-table";
import { useVirtualizer, useWindowVirtualizer } from "@tanstack/react-virtual";
import { Checkbox } from "@murv/checkbox";
import { ArrowUpward, ArrowDownward, SwapVert } from "@murv/icons";
import { useMURVContext } from "@murv/provider";
import EmptyStateContainer from "@murv/empty-state-container";
import { WindowScrollGridProps, ColumnType, IInfoMessage } from "./types";
import {
  StyledTable,
  TableWrapper,
  StyledRow,
  HeaderWrapper,
  IconWrapper,
  TableNonDataRow,
  NonDataContainer,
} from "./styles";

const EmptyErrorHandler = <T,>({
  table,
  error,
  infoMessage,
}: {
  table: Table<T>;
  error: boolean;
  infoMessage: IInfoMessage;
}) => {
  const {
    emptyState = "No Data",
    errorState = "Something Went Wrong!!",
    userMessage = "",
    buttonGroupProps,
  } = infoMessage || {};
  if (error) {
    return (
      <TableNonDataRow>
        <NonDataContainer>
          <EmptyStateContainer
            icon="SomethingWentWrong"
            primaryMessage={errorState}
            userMessage={userMessage}
            buttonGroupProps={buttonGroupProps}
          />
        </NonDataContainer>
      </TableNonDataRow>
    );
  }
  if (!table.getRowModel().rows.length) {
    return (
      <TableNonDataRow>
        <NonDataContainer>
          <EmptyStateContainer
            icon="NoResults"
            primaryMessage={emptyState}
            userMessage={userMessage}
            buttonGroupProps={buttonGroupProps}
          />
        </NonDataContainer>
      </TableNonDataRow>
    );
  }
  return null;
};

export const WindowScrollGrid = <T,>({
  fixedHeader = false,
  data,
  columns,
  enableRowSelection = false,
  onSortChange,
  sortQuery = [],
  onRowSelect,
  renderCell,
  numberOfFixedColumns = 0,
  dataTestId = "grid-component",
  loading = false,
  error = false,
  infoMessage = { emptyState: "No Data", errorState: "Something Went Wrong!!" },
  virtualizeThreshold = 30,
  rowHeight = 40,
  overscan = 5,
  scrollElementId,
}: WindowScrollGridProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>(sortQuery);
  const [rowSelection, setRowSelection] = useState({});
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const tableRef = useRef<HTMLTableElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const scrollMarginRef = useRef(0);
  const { theme } = useMURVContext();

  useEffect(() => {
    if (tableRef.current) {
      const headerCells = tableRef.current.querySelectorAll("thead th");
      let left = 0;
      const widths = Array.from(headerCells).map((cell) => {
        const width = (cell as HTMLElement).offsetWidth;
        left += width;
        return left;
      });
      setColumnWidths(widths);
    }
  }, [data]);

  useLayoutEffect(() => {
    if (!tableContainerRef.current) {
      return undefined;
    }

    const measureScrollMargin = () => {
      if (tableContainerRef.current) {
        const rect = tableContainerRef.current.getBoundingClientRect();
        const calculatedMargin = Math.max(0, rect.top + window.scrollY);
        scrollMarginRef.current = calculatedMargin;
        setScrollMargin(calculatedMargin);
      }
    };

    measureScrollMargin();
    const timer = setTimeout(() => {}, 100);
    window.addEventListener("resize", measureScrollMargin);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measureScrollMargin);
    };
  }, []);

  const customRender = useCallback(
    (info: CellContext<T, unknown>, textAlignment: "left" | "center" | "right") => (
      <div style={{ textAlign: textAlignment }}>
        {renderCell ? renderCell(info) : info.getValue()}
      </div>
    ),
    [renderCell],
  );

  const customHeaderRender = useCallback(
    (currColumn: ColumnType<T>) => (
      <div style={{ textAlign: currColumn.textAlignment || "left" }}>{currColumn.header}</div>
    ),
    [],
  );

  const newColumnList: ColumnDef<T>[] = useMemo(() => {
    const getFormattedColumns = (_columns: ColumnType<T>[]) =>
      _columns.reduce(
        (acc, currColumn) => {
          if (currColumn.type === "accessor" || !currColumn.type) {
            acc.push({
              id: currColumn.id,
              header: () => customHeaderRender(currColumn),
              accessorKey: currColumn.key,
              enableSorting: currColumn.isSortable,
              cell: (info: CellContext<T, unknown>) =>
                customRender(info, currColumn.textAlignment || "left"),
            });

            return acc;
          }
          if (currColumn.type === "group" && currColumn.columnsList)
            acc.push({
              id: currColumn.id,
              header: () => customHeaderRender(currColumn),
              columns: getFormattedColumns(currColumn.columnsList),
            });

          return acc;
        },
        [] as unknown as ColumnDef<T>[],
      );
    return getFormattedColumns(columns);
  }, [columns, customRender, customHeaderRender]);

  const renderHeaderCheckbox = (table: Table<T>) => (
    <div style={{ textAlign: "center" }}>
      <Checkbox
        {...{
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
          tabIndex: -1,
        }}
      />
    </div>
  );

  const renderCellCheckbox = (row: Row<T>) => (
    <div style={{ textAlign: "center" }} id={row.id}>
      <Checkbox
        {...{
          checked: row.getIsSelected(),
          disabled: !row.getCanSelect(),
          indeterminate: row.getIsSomeSelected(),
          onChange: row.getToggleSelectedHandler(),
          tabIndex: -1,
          id: `checkbox-${row.id}`,
        }}
      />
    </div>
  );

  const columnsData: ColumnDef<T>[] = [
    ...(enableRowSelection
      ? [
          {
            id: "select",
            header: ({ table }: { table: Table<T> }) => renderHeaderCheckbox(table),
            cell: ({ row }: { row: Row<T> }) => renderCellCheckbox(row),
          },
        ]
      : []),
    ...newColumnList,
  ];

  const handleSortChange = (updaterOrValue: Updater<SortingState>) => {
    const newSorting =
      typeof updaterOrValue === "function" ? updaterOrValue(sorting) : updaterOrValue;
    setSorting(newSorting);
    if (onSortChange) {
      onSortChange(newSorting);
    }
  };

  const handleRowSelectionChange = (updaterOrValue: Updater<{ [index: number]: boolean }>) => {
    const newRowSelection =
      typeof updaterOrValue === "function" ? updaterOrValue(rowSelection) : updaterOrValue;
    const selectRowList = Object.keys(newRowSelection).map((key) => key);
    setRowSelection(newRowSelection);
    onRowSelect(selectRowList);
  };

  const renderHeaderSorting = (header: Header<T, unknown>) => {
    const isColumnSortable = header.column.getCanSort();
    return (
      <>
        {flexRender(header.column.columnDef.header, header.getContext())}
        {isColumnSortable && !header.column.getIsSorted() && (
          <IconWrapper data-testid={`${dataTestId}-sortingIcon-${header.id}`}>
            <SwapVert color={theme.color.icon.primary} />
          </IconWrapper>
        )}
        {isColumnSortable && header.column.getIsSorted() && (
          <IconWrapper data-testid={`${dataTestId}-sortingIcon-${header.id}`}>
            {{
              asc: <ArrowUpward color={theme.color.icon.primary} />,
              desc: <ArrowDownward color={theme.color.icon.primary} />,
            }[header.column.getIsSorted() as string] ?? null}
          </IconWrapper>
        )}
      </>
    );
  };

  const table = useReactTable({
    data,
    columns: columnsData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: handleSortChange,
    manualSorting: !!onSortChange,
    enableRowSelection,
    enableSortingRemoval: false,
    onRowSelectionChange: handleRowSelectionChange,
  });

  const { rows } = table.getRowModel();

  const shouldVirtualize = rows.length > virtualizeThreshold;

  useEffect(() => {
    if (rows.length === 0 && scrollMargin !== 0) {
      setScrollMargin(0);
    }
  }, [rows.length, scrollMargin]);

  const virtualizerEnabled = shouldVirtualize && !loading && !error && rows.length > 0;

  const windowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan,
    enabled: virtualizerEnabled && !scrollElementId,
    scrollMargin,
    measureElement: (element) => element?.getBoundingClientRect().height ?? rowHeight,
  });

  const customScrollVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => {
      if (!scrollElementId) return null;
      const element = document.getElementById(scrollElementId);
      if (!element && virtualizerEnabled) {
        console.warn(
          `WindowScrollGrid: scrollElementId="${scrollElementId}" not found. ` +
            "Falling back to window scroll. " +
            "Make sure the element exists in the DOM before WindowScrollGrid renders.",
        );
      }
      return element;
    },
    estimateSize: () => rowHeight,
    overscan,
    enabled: virtualizerEnabled && !!scrollElementId,
    scrollMargin,
    measureElement: (element) => element?.getBoundingClientRect().height ?? rowHeight,
  });

  const rowVirtualizer = scrollElementId ? customScrollVirtualizer : windowVirtualizer;

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const prevShouldVirtualize = useRef(shouldVirtualize);
  const prevRowCount = useRef(rows.length);

  useEffect(() => {
    const wasVirtualizing = prevShouldVirtualize.current;
    const previousRowCount = prevRowCount.current;

    prevShouldVirtualize.current = shouldVirtualize;
    prevRowCount.current = rows.length;

    if (!shouldVirtualize) {
      return;
    }

    const justBecameVirtualized = !wasVirtualizing && shouldVirtualize;
    const significantDataChange = Math.abs(rows.length - previousRowCount) > 10;

    if (justBecameVirtualized || significantDataChange) {
      setTimeout(() => {
        rowVirtualizer.measure();
      }, 100);
    }
  }, [shouldVirtualize, rows.length, rowVirtualizer]);

  useEffect(() => {
    if (scrollMargin > 0 && shouldVirtualize) {
      setTimeout(() => {
        rowVirtualizer.measure();
      }, 100);
    }
  }, [scrollMargin, shouldVirtualize, rowVirtualizer]);

  useEffect(() => {
    if (!shouldVirtualize || !tableContainerRef.current) {
      return undefined;
    }

    let resizeTimeout: NodeJS.Timeout | null = null;
    let lastHeight = 0;
    let isMeasuring = false;

    const resizeObserver = new ResizeObserver((entries) => {
      const { contentRect } = entries[0];
      const newHeight = contentRect.height;

      const heightDiff = Math.abs(newHeight - lastHeight);
      const isInTransition = Math.abs(rows.length - prevRowCount.current) > 5;
      const threshold = isInTransition ? 20 : 50;

      if (heightDiff < threshold && lastHeight !== 0) {
        return;
      }

      if (isMeasuring) {
        return;
      }

      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        isMeasuring = true;

        if (tableContainerRef.current) {
          const rect = tableContainerRef.current.getBoundingClientRect();
          const calculatedMargin = Math.max(0, rect.top + window.scrollY);
          scrollMarginRef.current = calculatedMargin;
          setScrollMargin(calculatedMargin);
        }

        setTimeout(() => {
          rowVirtualizer.measure();
          lastHeight = newHeight;
          isMeasuring = false;
        }, 0);
      }, 150);
    });

    resizeObserver.observe(tableContainerRef.current);

    return () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeObserver.disconnect();
    };
  }, [shouldVirtualize]);

  useEffect(() => {
    if (sortQuery && sortQuery.length > 0) {
      setSorting(sortQuery);
    }
  }, [sortQuery]);

  const renderTableBody = () => {
    if (loading) {
      return (
        <>
          {rows.map((row, index) => (
            <StyledRow
              key={row.id}
              selected={row.getIsSelected()}
              tabIndex={index + 1}
              data-testid={`${dataTestId}-row-${row.id}`}
              disabled={false}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </StyledRow>
          ))}
          <EmptyErrorHandler table={table} error={error} infoMessage={infoMessage} />
        </>
      );
    }

    if (!shouldVirtualize) {
      return (
        <>
          {rows.map((row, index) => (
            <StyledRow
              key={row.id}
              selected={row.getIsSelected()}
              tabIndex={index + 1}
              data-testid={`${dataTestId}-row-${row.id}`}
              disabled={false}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </StyledRow>
          ))}
          <EmptyErrorHandler table={table} error={error} infoMessage={infoMessage} />
        </>
      );
    }

    if (rows.length === 0 || error) {
      return <EmptyErrorHandler table={table} error={error} infoMessage={infoMessage} />;
    }

    if (virtualRows.length === 0 && rows.length > 0) {
      return (
        <>
          {rows.map((row, index) => (
            <StyledRow
              key={row.id}
              selected={row.getIsSelected()}
              tabIndex={index + 1}
              data-testid={`${dataTestId}-row-${row.id}`}
              disabled={false}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </StyledRow>
          ))}
        </>
      );
    }

    const firstVirtualRow = virtualRows[0];
    const lastVirtualRow = virtualRows[virtualRows.length - 1];

    const isAtActualDataEnd = lastVirtualRow?.index === rows.length - 1;

    const paddingTop =
      virtualRows.length > 0 ? Math.max(0, (firstVirtualRow?.start || 0) - scrollMargin) : 0;

    const paddingBottom =
      virtualRows.length > 0 && !isAtActualDataEnd
        ? Math.max(0, totalSize - ((lastVirtualRow?.end || 0) - scrollMargin))
        : 0;

    return (
      <>
        {paddingTop > 0 && (
          <tr>
            <td
              colSpan={table.getVisibleLeafColumns().length}
              style={{ height: `${paddingTop}px`, padding: 0, border: "none" }}
              aria-label="Virtualization spacer"
            />
          </tr>
        )}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          return (
            <StyledRow
              key={row.id}
              selected={row.getIsSelected()}
              tabIndex={virtualRow.index + 1}
              data-testid={`${dataTestId}-row-${row.id}`}
              disabled={false}
              data-index={virtualRow.index}
              style={{ height: `${virtualRow.size}px` }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
              ))}
            </StyledRow>
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td
              colSpan={table.getVisibleLeafColumns().length}
              style={{ height: `${paddingBottom}px`, padding: 0, border: "none" }}
              aria-label="Virtualization spacer"
            />
          </tr>
        )}
      </>
    );
  };

  return (
    <TableWrapper maxHeight={undefined} enableScroll={false} ref={tableContainerRef}>
      <StyledTable
        numberOfFixedColumns={numberOfFixedColumns}
        fixedHeader={fixedHeader}
        data-testid={dataTestId}
        ref={tableRef}
        columnWidths={columnWidths}
      >
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan ? header.colSpan : 1}
                  data-testid={`${dataTestId}-header-${header.id}`}
                >
                  {header.isPlaceholder ? null : (
                    <HeaderWrapper
                      {...{
                        onClick: header.column.getToggleSortingHandler(),
                        role: "presentation",
                      }}
                      isColumnSortable={header.column.getCanSort()}
                    >
                      {renderHeaderSorting(header)}
                    </HeaderWrapper>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody key={`tbody-${shouldVirtualize}-${rows.length}`}>{renderTableBody()}</tbody>
      </StyledTable>
    </TableWrapper>
  );
};
