import type { Meta, StoryObj } from "@storybook/react";
import Breadcrumb, { BreadcrumbProps } from "@murv/breadcrumb";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Breadcrumb",
  component: Breadcrumb as React.ComponentType,
  tags: ["autodocs"],
  argTypes: {
    // backgroundColor: { control: 'color' },
  },
} satisfies Meta<BreadcrumbProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const BreadcrumbWithMoreThanFourLinks: Story = {
  args: {
    routes: [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
      { caption: "Fifth", url: "https://seller.flipkart.com" },
      { caption: "Sixth", url: "https://seller.flipkart.com" },
      { caption: "Last", url: "https://seller.flipkart.com" },
    ],
  },
};

export const BreadcrumbWithOneLink: Story = {
  args: {
    routes: [{ caption: "First", url: "https://seller.flipkart.com" }],
  },
};

export const BreadcrumbWithTwoLinks: Story = {
  args: {
    routes: [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
    ],
  },
};

export const BreadcrumbWithFourItem: Story = {
  args: {
    routes: [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
    ],
  },
};

export const BreadcrumbWithMoreThanFourItem: Story = {
  args: {
    routes: [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
      { caption: "Fifth", url: "https://seller.flipkart.com" },
    ],
  },
};

export const BreadcrumbWithNoHomeIconAndSeparatorIcon: Story = {
  args: {
    routes: [{ caption: "First", url: "https://seller.flipkart.com" }],
    showBaseIcon: false,
    showSeparatorIcon: false,
  },
};

export const BreadcrumbWithNoHomeIcon: Story = {
  args: {
    routes: [
      { caption: "First", url: "https://seller.flipkart.com" },
      { caption: "Second", url: "https://seller.flipkart.com" },
      { caption: "Third", url: "https://seller.flipkart.com" },
      { caption: "Fourth", url: "https://seller.flipkart.com" },
      { caption: "Fifth", url: "https://seller.flipkart.com" },
    ],
    showBaseIcon: false,
  },
};
