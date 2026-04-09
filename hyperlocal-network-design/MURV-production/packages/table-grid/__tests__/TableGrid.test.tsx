import React from "react";
import { render, fireEvent } from "test-utils";
import { TableGrid } from "../src/TableGrid";
import { ColumnType } from "../src/types";
import { User } from "../src/TableGrid.stories";

const onRowSelectMock = jest.fn();

describe("TableGrid Component", () => {
  const sampleData: User[] = [
    {
      firstName: "Tanner",
      lastName: "Linsley",
      age: 33,
      visits: 100,
      progress: 50,
      status: "Married",
    },
    {
      firstName: "Kevin",
      lastName: "Vandy",
      age: 27,
      visits: 200,
      progress: 300,
      status: "Single",
    },
  ];
  const sampleColumns: ColumnType<User>[] = [
    {
      key: "firstName",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "firstName",
      header: "First Name",
    },
    {
      key: "lastName",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "lastName",
      header: "Last Name",
    },
    {
      key: "age",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "age",
      header: "Age",
    },
    {
      key: "visits",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "visits",
      header: "Visits",
    },
    {
      key: "progress",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "progress",
      header: "Progress",
    },
    {
      key: "status",
      textAlignment: "left",
      type: "accessor",
      isSortable: true,
      width: 100,
      shouldTruncate: true,
      colSpan: 1,
      id: "status",
      header: "Status",
    },
  ];

  it("renders table with data and columns", () => {
    const { getByTestId, getByText } = render(
      <TableGrid<User> data={sampleData} columns={sampleColumns} onRowSelect={onRowSelectMock} />,
    );
    const tableComponent = getByTestId("grid-component");
    expect(tableComponent).toBeInTheDocument();
    sampleColumns.forEach((column) => {
      const columnHeader = getByTestId(`grid-component-header-${column.id}`);
      expect(columnHeader).toBeInTheDocument();
    });
    sampleData.forEach((dataItem, index) => {
      const dataRow = getByTestId(`grid-component-row-${index}`);
      expect(dataRow).toBeInTheDocument();
      Object.values(dataItem).forEach((value) => {
        const cellValue = getByText(value);
        expect(cellValue).toBeInTheDocument();
      });
    });
  });

  it("calls onSortChange when header cell is clicked", () => {
    const onSortChangeMock = jest.fn();
    const { getByTestId } = render(
      <TableGrid
        data={sampleData}
        columns={sampleColumns}
        onSortChange={onSortChangeMock}
        onRowSelect={onRowSelectMock}
      />,
    );
    const headerCell = getByTestId(`grid-component-sortingIcon-${sampleColumns[0].id}`);
    fireEvent.click(headerCell);
    expect(onSortChangeMock).toHaveBeenCalled();
  });

  it("calls onRowSelect when row selection checkbox is clicked", () => {
    const { getByTestId } = render(
      <TableGrid
        data={sampleData}
        columns={sampleColumns}
        enableRowSelection
        onRowSelect={onRowSelectMock}
      />,
    );
    const rowSelectionCheckbox =
      getByTestId("grid-component-row-1").querySelector('input[type="checkbox"]');
    if (rowSelectionCheckbox) {
      fireEvent.click(rowSelectionCheckbox);
      expect(onRowSelectMock).toHaveBeenCalledWith(["1"]);
    } else {
      fail("Row selection checkbox not found");
    }
  });
  it("matches snapshot for row selection", () => {
    const { getByTestId } = render(
      <TableGrid
        data={sampleData}
        columns={sampleColumns}
        enableRowSelection
        onRowSelect={onRowSelectMock}
      />,
    );
    const tableComponent = getByTestId("grid-component");
    expect(tableComponent).toMatchSnapshot();
  });
  it("uses row id when id property is present", () => {
    const dataWithIds: User[] = [
      {
        id: "user-1",
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        id: "user-2",
        firstName: "Kevin",
        lastName: "Vandy",
        age: 27,
        visits: 200,
        progress: 300,
        status: "Single",
      },
    ];
    const { getByTestId } = render(
      <TableGrid<User> data={dataWithIds} columns={sampleColumns} onRowSelect={onRowSelectMock} />,
    );

    // Verify rows use the id property as the row identifier
    expect(getByTestId("grid-component-row-user-1")).toBeInTheDocument();
    expect(getByTestId("grid-component-row-user-2")).toBeInTheDocument();
  });

  it("falls back to index when id property is not present", () => {
    const { getByTestId } = render(
      <TableGrid<User> data={sampleData} columns={sampleColumns} onRowSelect={onRowSelectMock} />,
    );

    // Verify rows without id use index as fallback
    expect(getByTestId("grid-component-row-0")).toBeInTheDocument();
    expect(getByTestId("grid-component-row-1")).toBeInTheDocument();
  });

  it("handles numeric id values", () => {
    const dataWithNumericIds: User[] = [
      {
        id: 100,
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        id: 200,
        firstName: "Kevin",
        lastName: "Vandy",
        age: 27,
        visits: 200,
        progress: 300,
        status: "Single",
      },
    ];
    const { getByTestId } = render(
      <TableGrid<User>
        data={dataWithNumericIds}
        columns={sampleColumns}
        onRowSelect={onRowSelectMock}
      />,
    );

    // Verify numeric ids are converted to strings
    expect(getByTestId("grid-component-row-100")).toBeInTheDocument();
    expect(getByTestId("grid-component-row-200")).toBeInTheDocument();
  });

  it("handles mixed data with and without id", () => {
    const mixedData: User[] = [
      {
        id: "user-1",
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        // No id property
        firstName: "Kevin",
        lastName: "Vandy",
        age: 27,
        visits: 200,
        progress: 300,
        status: "Single",
      },
    ];
    const { getByTestId } = render(
      <TableGrid<User> data={mixedData} columns={sampleColumns} onRowSelect={onRowSelectMock} />,
    );

    // First row uses id, second row uses index
    expect(getByTestId("grid-component-row-user-1")).toBeInTheDocument();
    expect(getByTestId("grid-component-row-1")).toBeInTheDocument();
  });

  it("ensures unique row ids when using id property", () => {
    const dataWithIds: User[] = [
      {
        id: "unique-id-1",
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        id: "unique-id-2",
        firstName: "Kevin",
        lastName: "Vandy",
        age: 27,
        visits: 200,
        progress: 300,
        status: "Single",
      },
    ];
    const { getByTestId } = render(
      <TableGrid<User>
        data={dataWithIds}
        columns={sampleColumns}
        enableRowSelection
        onRowSelect={onRowSelectMock}
      />,
    );

    // Verify each row has a unique identifier
    const row1 = getByTestId("grid-component-row-unique-id-1");
    const row2 = getByTestId("grid-component-row-unique-id-2");

    expect(row1).toBeInTheDocument();
    expect(row2).toBeInTheDocument();
    expect(row1).not.toBe(row2);
  });
});
