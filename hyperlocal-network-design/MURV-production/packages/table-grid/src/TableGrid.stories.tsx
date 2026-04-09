import type { Meta, StoryObj } from "@storybook/react";
import React, { useState, useMemo } from "react";
import { TableGrid } from "./TableGrid";
import { ContainerGrid } from "./ContainerGrid";
import { WindowScrollGrid } from "./WindowScrollGrid";

const meta = {
  title: "Components/TableGrid",
  component: TableGrid<User>,
  tags: ["autodocs"],
  args: {},
} as Meta;

export default meta;
type Story = StoryObj<typeof TableGrid<User>>;
type ContainerStory = StoryObj<typeof ContainerGrid<User>>;
type WindowStory = StoryObj<typeof WindowScrollGrid<User>>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const Default: Story = {
  args: {
    data: [
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
        progress: 100,
        status: "Single",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        firstName: "Tanner",
        lastName: "Linsley",
        age: 33,
        visits: 100,
        progress: 50,
        status: "Married",
      },
    ],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    onRowHover: (data, index) => console.log("Row hovered:", index, data),
    numberOfFixedColumns: 2,
    dataTestId: "table-grid-default",
    loading: false,
    error: false,
  },
};

export const LoaderStory: Story = {
  args: {
    data: [],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    numberOfFixedColumns: 2,
    loading: true,
  },
};

export const ErrorStory: Story = {
  args: {
    data: [],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    numberOfFixedColumns: 2,
    error: true,
  },
};

export const EmptyStory: Story = {
  args: {
    data: [],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    numberOfFixedColumns: 2,
  },
};

export const DefaultSortStory: Story = {
  render(props) {
    const [defaultQuery, setDefaultQuery] = useState([
      {
        id: "age",
        desc: false,
      },
    ]);
    const changeSortQuery = () => {
      setDefaultQuery([
        {
          id: "visits",
          desc: true,
        },
      ]);
    };

    return (
      <>
        <button type="button" onClick={changeSortQuery}>
          Change Default sort
        </button>
        <TableGrid {...props} sortQuery={defaultQuery} />;
      </>
    );
  },
  args: {
    data: [],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => {
      console.log(data);
    },
    numberOfFixedColumns: 2,
  },
};

export interface User {
  id?: string | number;
  firstName: string;
  lastName: string;
  age: number;
  visits: number;
  progress: number;
  status: string;
}

export const StoryWithId: Story = {
  args: {
    data: [
      {
        id: "1112",
        firstName: "John",
        lastName: "Doe",
        age: 30,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        id: "1113",
        firstName: "Jane",
        lastName: "Doe",
        age: 25,
        visits: 100,
        progress: 50,
        status: "Married",
      },
      {
        id: "1113qweq",
        firstName: "Kane",
        lastName: "Smith",
        age: 25,
        visits: 100,
        progress: 50,
        status: "Single",
      },
    ],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    numberOfFixedColumns: 2,
  },
};

export const EmptyStoryWithInfoMessage: Story = {
  args: {
    data: [],
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("data", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log(data),
    numberOfFixedColumns: 2,
    infoMessage: {
      emptyState: "No data found!",
      buttonGroupProps: {
        buttons: [
          {
            children: "Create New",
          },
        ],
      },
    },
  },
};

// Generate large dataset for virtualization testing (deterministic)
const generateLargeDataset = (count: number): User[] =>
  Array.from({ length: count }, (_, index) => ({
    firstName: `First${index}`,
    lastName: `Last${index}`,
    age: 20 + (index % 50),
    visits: (index * 17 + 123) % 1000, // Deterministic pseudo-random
    progress: (index * 7 + 31) % 100, // Deterministic pseudo-random
    status: index % 2 === 0 ? "Married" : "Single",
  }));

export const VirtualizedStory: ContainerStory = {
  render: (args) => <ContainerGrid {...args} />,
  args: {
    data: generateLargeDataset(100), // 100 rows
    columns: [
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
        isSortable: false,
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
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("Selected rows:", data),
    renderCell: (data) => <div>{data.getValue()}</div>,
    onSortChange: (data) => console.log("Sort changed:", data),
    numberOfFixedColumns: 1,
    maxHeight: "500px",
    virtualizeThreshold: 20,
    rowHeight: 40,
    overscan: 10,
  },
};

export const VirtualizedWithSelectionStory: ContainerStory = {
  render: (args) => <ContainerGrid {...args} />,
  args: {
    data: generateLargeDataset(100), // 100 rows
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "status",
        textAlignment: "left",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("Selected rows:", data),
    numberOfFixedColumns: 2,
    maxHeight: "400px",
    virtualizeThreshold: 20,
    rowHeight: 48,
    overscan: 5,
  },
};

// Interactive story with page size controls to test virtualization transitions
export const DynamicPageSizeStory: ContainerStory = {
  render(props) {
    const [pageSize, setPageSize] = useState(20);
    // Use useMemo to prevent unnecessary data regeneration
    const data = useMemo(() => generateLargeDataset(pageSize), [pageSize]);

    const pageSizeOptions = [10, 20, 30, 50, 100];

    return (
      <div>
        <div
          style={{
            padding: "16px",
            marginBottom: "16px",
            background: "#f5f5f5",
            borderRadius: "8px",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            Page Size Controls (Tests virtualization threshold transitions)
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  background: pageSize === size ? "#1976d2" : "#fff",
                  color: pageSize === size ? "#fff" : "#333",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontWeight: pageSize === size ? "bold" : "normal",
                }}
              >
                {size} rows
              </button>
            ))}
          </div>
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
            Current: {pageSize} rows | Threshold: 20 | Virtualized:{" "}
            {pageSize > 20 ? "✅ Yes" : "❌ No"}
          </div>
        </div>

        <ContainerGrid
          {...props}
          data={data}
          onRowSelect={(selectedRows: (number | string)[]) =>
            console.log("Selected rows:", selectedRows)
          }
        />
      </div>
    );
  },
  args: {
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "visits",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "visits",
        header: "Visits",
      },
      {
        key: "progress",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    maxHeight: "500px", // Uses container scroll
    virtualizeThreshold: 20, // Low threshold to easily test transitions
    rowHeight: 40,
    overscan: 10,
  },
};

// Window scroll virtualization story
export const WindowScrollVirtualizedStory: WindowStory = {
  render: (args) => <WindowScrollGrid {...args} />,
  args: {
    data: generateLargeDataset(30), // 30 rows for easier testing
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "visits",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "visits",
        header: "Visits",
      },
      {
        key: "progress",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    onRowSelect: (data: (number | string)[]) => console.log("Selected rows:", data),
    virtualizeThreshold: 20,
    rowHeight: 40,
    overscan: 10,
  },
};

// Interactive story to compare container scroll vs window scroll
export const ScrollModeComparisonStory = {
  render(props: any) {
    const [useWindowScroll, setUseWindowScroll] = useState(false);
    const data = useMemo(() => generateLargeDataset(30), []);

    return (
      <div>
        <div
          style={{
            padding: "16px",
            marginBottom: "16px",
            background: "#f5f5f5",
            borderRadius: "8px",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}
        >
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            Scroll Mode Comparison (Container vs Window)
          </div>
          <p style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#666" }}>
            Compare container scroll (with maxHeight) vs window scroll (full page). Window scroll
            uses ResizeObserver with 150ms debounce and 50px threshold to handle dynamic content.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setUseWindowScroll(false)}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                background: !useWindowScroll ? "#1976d2" : "#fff",
                color: !useWindowScroll ? "#fff" : "#333",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontWeight: !useWindowScroll ? "bold" : "normal",
              }}
            >
              Container Scroll
            </button>
            <button
              type="button"
              onClick={() => setUseWindowScroll(true)}
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                background: useWindowScroll ? "#1976d2" : "#fff",
                color: useWindowScroll ? "#fff" : "#333",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontWeight: useWindowScroll ? "bold" : "normal",
              }}
            >
              Window Scroll
            </button>
          </div>
          <div style={{ marginTop: "8px", fontSize: "14px", color: "#666" }}>
            Current Mode: {useWindowScroll ? "Window Scroll" : "Container Scroll"}
            <br />
            {useWindowScroll
              ? "The entire page scrolls, table has no height constraint"
              : "Table scrolls independently with maxHeight constraint"}
          </div>
        </div>

        {useWindowScroll ? (
          <WindowScrollGrid
            {...props}
            data={data}
            onRowSelect={(selectedRows: (number | string)[]) =>
              console.log("Selected rows:", selectedRows)
            }
          />
        ) : (
          <ContainerGrid
            {...props}
            data={data}
            maxHeight="500px"
            onRowSelect={(selectedRows: (number | string)[]) =>
              console.log("Selected rows:", selectedRows)
            }
          />
        )}
      </div>
    );
  },
  args: {
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "visits",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "visits",
        header: "Visits",
      },
      {
        key: "progress",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    virtualizeThreshold: 20,
    rowHeight: 40,
    overscan: 10,
  },
};

// Window scroll with dynamic page size - tests scrollMargin re-measurement on data changes
export const WindowScrollDynamicPageSizeStory: WindowStory = {
  render(props) {
    const [pageSize, setPageSize] = useState(30);
    const data = useMemo(() => generateLargeDataset(pageSize), [pageSize]);

    const pageSizeOptions = [20, 30, 50, 100];

    return (
      <div>
        <div
          style={{
            padding: "20px",
            marginBottom: "20px",
            background: "#e8f5e9",
            borderRadius: "8px",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>🧪 Window Scroll + Dynamic Page Size Test</h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#555" }}>
            <strong>Purpose:</strong> Test window scroll virtualization with changing data sizes.
            Tests that ResizeObserver handles large height changes (&gt;50px threshold) correctly.
            <br />
            <strong>Watch for:</strong> Smooth transitions, no blank spaces, correct virtualization.
            Check console for [Ankur] logs showing ResizeObserver behavior.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <strong>Page Size:</strong>
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setPageSize(size)}
                style={{
                  padding: "8px 16px",
                  cursor: "pointer",
                  background: pageSize === size ? "#4caf50" : "#fff",
                  color: pageSize === size ? "#fff" : "#333",
                  border: "1px solid #4caf50",
                  borderRadius: "4px",
                  fontWeight: pageSize === size ? "bold" : "normal",
                }}
              >
                {size} rows
              </button>
            ))}
          </div>
          <div style={{ marginTop: "10px", fontSize: "14px", color: "#2e7d32" }}>
            📊 Current: {pageSize} rows | Threshold: 20 | Virtualized:{" "}
            {pageSize > 20 ? "✅ Yes" : "❌ No"}
          </div>
        </div>

        <WindowScrollGrid
          {...props}
          data={data}
          onRowSelect={(selectedRows: (number | string)[]) =>
            console.log("Selected rows:", selectedRows)
          }
        />

        {/* Bottom spacer for full scroll testing */}
        <div
          style={{
            height: "200px",
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "40px",
            color: "#999",
          }}
        >
          End of page - scroll back up to change page size
        </div>
      </div>
    );
  },
  args: {
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "visits",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "visits",
        header: "Visits",
      },
      {
        key: "progress",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    virtualizeThreshold: 20,
    rowHeight: 40,
    overscan: 10,
  },
};

// Window scroll with progressive loading - simulates real API behavior with cells loading individually
export const WindowScrollProgressiveLoadingStory: WindowStory = {
  render(props) {
    const [pageSize, setPageSize] = useState(30);
    const [currentData, setCurrentData] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    // Track which cells have "loaded their data" - simulates per-cell API calls with 2 stages
    const [partiallyLoadedCells, setPartiallyLoadedCells] = useState<Set<string>>(new Set());
    const [loadedCells, setLoadedCells] = useState<Set<string>>(new Set());

    const pageSizeOptions = [20, 30, 50, 100];

    // Simulate individual cells loading their content in 2 stages (like images, prices, etc.)
    // Stage 1: Partial load (e.g., text loads but images/icons still loading)
    // Stage 2: Full load (everything rendered, including images/icons that increase height slightly)
    const simulateCellLoading = (data: User[]) => {
      const columns = ["firstName", "lastName", "age", "visits", "progress", "status"];

      data.forEach((_row, rowIndex) => {
        columns.forEach((col) => {
          const cellKey = `${rowIndex}-${col}`;

          // Stage 1: Partial load after 150-600ms (text appears, smaller height)
          const partialDelay = 150 + Math.random() * 450;
          setTimeout(() => {
            setPartiallyLoadedCells((prev) => new Set([...prev, cellKey]));
          }, partialDelay);

          // Stage 2: Full load after additional 200-500ms (images/icons load, height increases)
          const fullDelay = partialDelay + 200 + Math.random() * 300;
          setTimeout(() => {
            setLoadedCells((prev) => new Set([...prev, cellKey]));
          }, fullDelay);
        });
      });
    };

    // Simulate progressive data loading with 3 API calls
    const loadDataProgressively = (targetSize: number) => {
      setLoading(true);
      setLoadingProgress(0);
      setCurrentData([]); // Clear existing data
      setPartiallyLoadedCells(new Set()); // Clear partially loaded cells
      setLoadedCells(new Set()); // Clear loaded cells

      const chunkSize = Math.ceil(targetSize / 3); // Divide into 3 chunks

      // First API call - load 1/3 of data after 1.5 seconds
      setTimeout(() => {
        const chunk1 = generateLargeDataset(chunkSize);
        setCurrentData(chunk1);
        setLoadingProgress(33);
        // Start loading cells progressively for chunk 1
        simulateCellLoading(chunk1);
      }, 1500);

      // Second API call - load 2/3 of data after 3 seconds
      setTimeout(() => {
        const chunk2 = generateLargeDataset(chunkSize * 2);
        setCurrentData(chunk2);
        setLoadingProgress(66);
        // Continue loading cells for chunk 2
        simulateCellLoading(chunk2);
      }, 3000);

      // Third API call - load all data after 5 seconds
      setTimeout(() => {
        const finalData = generateLargeDataset(targetSize);
        setCurrentData(finalData);
        setLoadingProgress(100);
        setLoading(false);
        // Load remaining cells
        simulateCellLoading(finalData);
      }, 5000);
    };

    const handlePageSizeChange = (size: number) => {
      setPageSize(size);
      loadDataProgressively(size);
    };

    // Load initial data on mount
    React.useEffect(() => {
      loadDataProgressively(100);
    }, []);

    // Custom cell renderer that shows 3-stage loading (mimics production behavior)
    const renderCellWithLoading = (info: any) => {
      const rowIndex = info.row.index;
      const columnId = info.column.id;
      const cellKey = `${rowIndex}-${columnId}`;
      const isFullyLoaded = loadedCells.has(cellKey);
      const isPartiallyLoaded = partiallyLoadedCells.has(cellKey);

      // Stage 1: Skeleton loader - smallest height (20px)
      if (!isPartiallyLoaded) {
        return (
          <div
            style={{
              height: "20px",
              background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
              backgroundSize: "200% 100%",
              animation: "loading 1.5s infinite",
              borderRadius: "4px",
            }}
          />
        );
      }

      // Stage 2: Partial load - medium height (text visible, no icons/images)
      // Simulates: API returned data but images/icons still loading
      if (!isFullyLoaded) {
        // Add slight random variation to heights (32-38px) to mimic real content
        const baseHeight = 32 + (rowIndex % 3) * 2;
        return (
          <div
            style={{
              minHeight: `${baseHeight}px`,
              padding: "6px 4px",
              color: "#666",
              fontStyle: "italic",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {info.getValue()}
            <span
              style={{
                width: "12px",
                height: "12px",
                border: "2px solid #ccc",
                borderTopColor: "#666",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        );
      }

      // Stage 3: Fully loaded - tallest height (with icons/badges that add height)
      // Add random variation (40-52px) to simulate different content types
      const cellValue = info.getValue();
      const fullHeight = 40 + (rowIndex % 4) * 3;

      // Special case: lastName column gets an "Apply" button (like production)
      // This adds significant height variation (button adds ~24-32px)
      if (columnId === "lastName") {
        return (
          <div
            style={{
              minHeight: `${fullHeight + 10}px`, // Extra height for button row
              padding: "8px 6px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <span style={{ fontWeight: 500 }}>{cellValue}</span>
            <button
              type="button"
              onClick={() => {
                console.log(`Apply clicked for row ${rowIndex}`);
              }}
              style={{
                padding: "4px 12px",
                fontSize: "11px",
                background: "#4caf50",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontWeight: 500,
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#45a049";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#4caf50";
              }}
            >
              💰 Apply
            </button>
          </div>
        );
      }

      return (
        <div
          style={{
            minHeight: `${fullHeight}px`,
            padding: "10px 6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontWeight: 500 }}>{cellValue}</span>
          {/* Simulate badges/icons that add to height */}
          {columnId === "status" && (
            <span
              style={{
                fontSize: "10px",
                padding: "2px 6px",
                borderRadius: "10px",
                background: "#e3f2fd",
                color: "#1976d2",
              }}
            >
              ✓
            </span>
          )}
          {columnId === "age" && rowIndex % 5 === 0 && (
            <span style={{ fontSize: "10px", color: "#f57c00" }}>⭐</span>
          )}
        </div>
      );
    };

    return (
      <div>
        <style>{`
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <div
          style={{
            padding: "20px",
            marginBottom: "20px",
            background: loading ? "#fff3cd" : "#e8f5e9",
            borderRadius: "8px",
            position: "sticky",
            top: 0,
            zIndex: 1000,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            transition: "background 0.3s ease",
          }}
        >
          <h3 style={{ margin: "0 0 10px 0" }}>🔄 Window Scroll + Progressive Cell Loading Test</h3>
          <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#555" }}>
            <strong>Purpose:</strong> Simulate production with 3 table API calls (1.5s → 3s → 5s) +
            per-cell 2-stage loading (skeleton → partial → full). Each cell height changes slightly
            as it loads. Completes in ~5-6 seconds total.
            <br />
            <strong>Watch for:</strong> Cells expand in 2 stages (20px → 32-38px → 40-52px).
            <strong>Last Name column</strong> adds &quot;Apply&quot; button in stage 3 (adds
            ~24-32px more height). Table height adjusts automatically. No padding issues.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <strong>Page Size:</strong>
            {pageSizeOptions.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => handlePageSizeChange(size)}
                disabled={loading}
                style={{
                  padding: "8px 16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  background: pageSize === size ? "#4caf50" : "#fff",
                  color: pageSize === size ? "#fff" : "#333",
                  border: "1px solid #4caf50",
                  borderRadius: "4px",
                  fontWeight: pageSize === size ? "bold" : "normal",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {size} rows
              </button>
            ))}
          </div>

          {loading && (
            <div style={{ marginTop: "15px" }}>
              <div style={{ fontSize: "14px", color: "#856404", marginBottom: "8px" }}>
                🔄 Loading rows ({loadingProgress}%) + each cell loading in 2 stages (causing
                micro-height changes)...
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "#e0e0e0",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${loadingProgress}%`,
                    height: "100%",
                    background: "#4caf50",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
              <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                Table API Call{" "}
                {(() => {
                  if (loadingProgress === 0) return "1";
                  if (loadingProgress === 33) return "1";
                  if (loadingProgress === 66) return "2";
                  return "3";
                })()}{" "}
                of 3{loadingProgress === 33 && " completed"}
                {loadingProgress === 66 && " completed"}
                {loadingProgress === 100 && " completed"}
                {loadingProgress > 0 &&
                  " • Cells loading in 2 stages: skeleton → partial (text) → full (Last Name gets Apply button)"}
              </div>
            </div>
          )}

          <div
            style={{ marginTop: "10px", fontSize: "14px", color: loading ? "#856404" : "#2e7d32" }}
          >
            📊 Target: {pageSize} rows | Current: {currentData.length} rows | Threshold: 20
            <br />
            Virtualized: {currentData.length > 20 ? "✅ Yes" : "❌ No"}
            <br />
            💡 Watch cells load progressively (skeleton → full content) causing table height changes
          </div>
        </div>

        <WindowScrollGrid
          {...props}
          data={currentData}
          loading={loading && currentData.length === 0} // Show loader only when no data
          renderCell={renderCellWithLoading} // Custom renderer showing progressive loading
          onRowSelect={(selectedRows: (number | string)[]) =>
            console.log("Selected rows:", selectedRows)
          }
        />

        {/* Bottom spacer for full scroll testing */}
        <div
          style={{
            height: "200px",
            background: "#f5f5f5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: "40px",
            color: "#999",
          }}
        >
          End of page - scroll back up to change page size
        </div>
      </div>
    );
  },
  args: {
    columns: [
      {
        key: "firstName",
        textAlignment: "left",
        type: "accessor",
        isSortable: true,
        width: 150,
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
        width: 150,
        shouldTruncate: true,
        colSpan: 1,
        id: "lastName",
        header: "Last Name",
      },
      {
        key: "age",
        textAlignment: "center",
        type: "accessor",
        isSortable: true,
        width: 80,
        shouldTruncate: true,
        colSpan: 1,
        id: "age",
        header: "Age",
      },
      {
        key: "visits",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "visits",
        header: "Visits",
      },
      {
        key: "progress",
        textAlignment: "right",
        type: "accessor",
        isSortable: false,
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
        isSortable: false,
        width: 100,
        shouldTruncate: true,
        colSpan: 1,
        id: "status",
        header: "Status",
      },
    ],
    fixedHeader: true,
    enableRowSelection: true,
    virtualizeThreshold: 20,
    rowHeight: 40,
    overscan: 10,
  },
};
