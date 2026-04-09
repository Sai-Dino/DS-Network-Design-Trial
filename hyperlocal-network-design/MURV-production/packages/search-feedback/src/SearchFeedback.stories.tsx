import React from "react";
import { StoryObj, Meta } from "@storybook/react";
import { Button } from "@murv/button";
import SearchFeedback from "./SearchFeedback";

const meta = {
  title: "Components/SearchFeedback",
  component: SearchFeedback,
  tags: ["autodocs"],
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultSearchFeedbackStory: Story = {
  args: {
    totalItemCount: 1,
    foundItemCount: 1,
    foundItems: ["XYZ"],
    notFoundItemCount: 0,
    notFoundItems: [],
    actionLabel: "Copy",
  },
};

export const MultiValueNoResultStory: Story = {
  args: {
    totalItemCount: 3,
    foundItemCount: 0,
    foundItems: [],
    notFoundItemCount: 3,
    notFoundItems: ["XYZ", "ABC", "PQR"],
    actionLabel: "Copy",
  },
};
export const MultiValueResultStory: Story = {
  args: {
    totalItemCount: 3,
    foundItemCount: 3,
    foundItems: ["XYZ", "ABC", "PQR"],
    notFoundItemCount: 0,
    notFoundItems: [],
    actionLabel: "Copy",
  },
};
export const SingleValueResultStory: Story = {
  args: {
    totalItemCount: 1,
    foundItemCount: 0,
    foundItems: [],
    notFoundItemCount: 1,
    notFoundItems: ["XYZ"],
    actionLabel: "Copy",
  },
};
export const MixedValueSingleResultStory: Story = {
  args: {
    totalItemCount: 2,
    foundItemCount: 1,
    foundItems: ["XYZ"],
    notFoundItemCount: 1,
    notFoundItems: ["ABC"],
    actionLabel: "Copy",
  },
};
export const MixedValueMultiResultStory: Story = {
  args: {
    totalItemCount: 5,
    foundItemCount: 2,
    foundItems: ["XYZ", "PQR"],
    notFoundItemCount: 3,
    notFoundItems: ["ABC", "DEF", "RST"],
    actionLabel: "Copy",
  },
};

export const TotalItemsStory: Story = {
  args: {
    totalItemCount: 450,
    foundItemCount: 0,
    foundItems: [],
    notFoundItemCount: 0,
    notFoundItems: [],
    displayMode: "total",
    showActions: false,
  },
  render: (args) => (
    <div
      style={{ display: "flex", alignItems: "center", gap: "16px", justifyContent: "flex-start" }}
    >
      <SearchFeedback totalItemCount={0} foundItemCount={0} notFoundItemCount={0} {...args} />
      <Button buttonType="inline" buttonStyle="brand" size="small">
        Tertiary action
      </Button>
      <Button buttonType="inline" buttonStyle="brand" size="small">
        More action
      </Button>
    </div>
  ),
};
