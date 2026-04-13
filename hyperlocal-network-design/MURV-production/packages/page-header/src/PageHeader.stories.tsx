import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ExpandMore } from "@murv/icons";
import { PageHeader, PageHeaderProps } from "./index";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  argTypes: {},
  decorators: [
    (Story) => (
      <div
        style={{
          zoom: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<PageHeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const PageHeaderExample: Story = {
  args: {
    pageHeaderText: "Page Title",
    breadcrumbProps: {
      routes: [
        { caption: "Home", url: "/" },
        { caption: "Link", url: "/" },
        { caption: "Link", url: "/" },
      ],
    },
    tags: [{ tagText: "Label 1" }, { tagText: "Label 2" }],
    buttonGroupProps: {
      buttons: [
        { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
        { buttonType: "secondary", children: "Secondary", onClick: () => {} },
        { buttonType: "primary", children: "Primary", onClick: () => {} },
        { buttonType: "secondary", children: "More", SuffixIcon: ExpandMore, onClick: () => {} },
      ],
    },
    buttonProps: {
      onClick: () => {},
      buttonType: "secondary",
      className: "temp",
    },
    filterProps: {
      filterConfig: [
        {
          filterId: "location",
          filterLabel: "Location",
          filterType: "single-select",
          filterProps: {
            options: [
              { label: "New York", value: "ny" },
              { label: "Los Angeles", value: "la" },
              { label: "Chicago", value: "chi" },
            ],
          },
        },
        {
          filterId: "category",
          filterLabel: "Category",
          filterType: "single-select",
          filterProps: {
            options: [
              { label: "Electronics", value: "electronics" },
              { label: "Furniture", value: "furniture" },
              { label: "Clothing", value: "clothing" },
            ],
          },
        },
        {
          filterId: "status",
          filterLabel: "Status",
          filterType: "multi-select",
          filterProps: {
            nodes: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Pending", value: "pending" },
            ],
          },
        },
        {
          filterId: "date_added",
          filterLabel: "Date Added",
          filterType: "single-date-select",
          filterProps: {
            dateOutputFormat: {
              formatStr: "MM-dd-yyyy",
            },
          },
        },
        {
          filterId: "date_range",
          filterLabel: "Date Range",
          filterType: "range-date-select",
          filterProps: {
            dateOutputFormat: {
              formatStr: "MM-dd-yyyy",
            },
            activeCalenderType: "DAY",
          },
        },
      ],
    },
  },
  parameters: {},
};

// Example with search bar in the page header
export const PageHeaderWithSearch: Story = {
  args: {
    pageHeaderText: "Products",
    breadcrumbProps: {
      routes: [
        { caption: "Home", url: "/" },
        { caption: "Products", url: "/products" },
      ],
    },
    filterProps: {
      filterConfig: [
        {
          filterId: "category",
          filterLabel: "Category",
          filterType: "single-select",
          filterProps: {
            options: [
              { label: "Electronics", value: "electronics" },
              { label: "Furniture", value: "furniture" },
              { label: "Clothing", value: "clothing" },
            ],
          },
        },
      ],
    },
    buttonProps: {
      onClick: () => console.log("Button clicked"),
      buttonType: "primary",
      children: "Add Product",
    },
    searchProps: {
      id: "header-search",
      testId: "header-search-test-id",
      name: "Page Search",
      placeholder: "Search in this page...",
      initialQuery: "",
      debounceTimer: 300,
      onSearch: (query, id) => {
        console.log(`Search triggered with: ${query} from ${id}`);
      },
      onChange: (query, id) => {
        console.log(`Search input changed: ${query} from ${id}`);
      },
      onClear: (id) => {
        console.log(`Search cleared from ${id}`);
      },
      disabled: false,
    },
  },
  parameters: {},
};

export const PageHeaderWithNoHomeIcon: Story = {
  args: {
    pageHeaderText: "Products",
    breadcrumbProps: {
      routes: [
        { caption: "Home", url: "/" },
        { caption: "Products", url: "/products" },
      ],
      showBaseIcon: false,
    },
  },
};
