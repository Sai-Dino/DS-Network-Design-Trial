import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Divider } from "@murv/divider";
import { TableGrid } from "@murv/grid-table";
import { Pagination } from "./Pagination";
import { IPageSizeSelectorProps, IPaginationProps } from "./types";
import { PaginationSelectorContainer } from "./storyStyles";

interface StoryProps extends IPaginationProps {
  pageSizeOptions?: IPageSizeSelectorProps["options"];
  selectedPageSize?: number;
  onPageSizeChange?: (newPageSize: number) => void;
}

const generateStory = (
  args: StoryProps,
  totalItems: number,
  name: string = "page-selector",
): React.ReactNode => {
  const {
    currentPage: initialCurrentPage,
    pageSize: initialPageSize,
    pageSizeOptions,
    selectedPageSize,
    onPageSizeChange,
  } = args;

  const [currentPage, setCurrentPage] = useState(initialCurrentPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize || selectedPageSize || 10);
  const [data, setData] = useState<
    {
      firstName: string;
      lastName: string;
      age: number;
      visits: number;
      progress: number;
      status: string;
    }[]
  >([]);
  const generateTableData = (total: number, size: number): any[] => {
    const tableData = [];
    const startIndex = (currentPage - 1) * size;
    const endIndex = Math.min(startIndex + size, total);
    for (let i = startIndex; i < endIndex; i += 1) {
      tableData.push({
        firstName: `Person ${i + 1}`,
        lastName: `Last Name`,
        age: Math.floor(Math.random() * 50) + 20,
        visits: Math.floor(Math.random() * 50) + 20,
        progress: Math.floor(Math.random() * 50) + 20,
        status: "Single",
      });
    }
    return tableData;
  };
  useEffect(() => {
    setData(generateTableData(totalItems, pageSize));
  }, [totalItems, pageSize, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
  };

  return (
    <>
      <Divider direction="horizontal" additionalStyles={{ borderColor: "#F5F5F5" }} />
      <TableGrid
        data={data}
        onRowSelect={() => {}}
        columns={[
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
        ]}
      />
      <PaginationSelectorContainer>
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          options={pageSizeOptions}
          selectedPageSize={selectedPageSize}
          onChange={handlePageSizeChange}
          name={name}
        />
      </PaginationSelectorContainer>
    </>
  );
};

const meta: Meta = {
  title: "Components/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  argTypes: {
    currentPage: {
      control: { type: "number" },
      defaultValue: 1,
      type: { name: "number" },
    },
    totalItems: {
      control: { type: "number" },
      defaultValue: 250,
      type: { name: "number" },
    },
    pageSize: {
      control: { type: "number" },
      defaultValue: 10,
      type: { name: "number" },
    },
    selectedPageSize: {
      control: { type: "number" },
      defaultValue: 10,
      type: { name: "number" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = (args: StoryProps) => generateStory(args, 250);

Default.args = {
  currentPage: 1,
  pageSizeOptions: [
    { label: "10", value: 10 },
    { label: "20", value: 20 },
    { label: "50", value: 50 },
  ],
  selectedPageSize: 10,
  onPageSizeChange: (newPageSize: number) => console.log("New Page Size:", newPageSize),
};

Default.storyName = "Default";
Default.parameters = {
  docs: {
    description: {
      story: "This story demonstrates Pagination.",
    },
  },
};
export const WithoutSelector: Story = (args: StoryProps) => generateStory(args, 250);

WithoutSelector.args = {
  currentPage: 1,
  selectedPageSize: 10,
  onPageSizeChange: (newPageSize: number) => console.log("New Page Size:", newPageSize),
};

WithoutSelector.storyName = "Without PageSizeSelector";
WithoutSelector.parameters = {
  docs: {
    description: {
      story: "This story demonstrates Pagination without the PageSizeSelector component.",
    },
  },
};

export const DualTables: Story = (args: StoryProps) => (
  <>
    <h3>Table 1</h3>
    {generateStory({ ...args, currentPage: 1, selectedPageSize: 10 }, 250, "table-1-page-selector")}
    <Divider direction="horizontal" additionalStyles={{ borderColor: "#CCC", margin: "20px 0" }} />
    <h3>Table 2</h3>
    {generateStory({ ...args, currentPage: 1, selectedPageSize: 10 }, 150, "table-2-page-selector")}
  </>
);

DualTables.args = {
  currentPage: 1,
  pageSizeOptions: [
    { label: "10", value: 10 },
    { label: "20", value: 20 },
    { label: "50", value: 50 },
  ],
  selectedPageSize: 10,
  onPageSizeChange: (newPageSize: number) => console.log("New Page Size:", newPageSize),
};

DualTables.storyName = "Dual Tables";
DualTables.parameters = {
  docs: {
    description: {
      story: "This story demonstrates two tables, each with its own pagination.",
    },
  },
};
