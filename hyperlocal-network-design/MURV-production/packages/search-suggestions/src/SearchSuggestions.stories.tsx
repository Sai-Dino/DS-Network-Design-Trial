import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useSearchSuggestions } from "./index";
import { ISearchSuggestionsProps } from "./types";

const onOptionClick = (selectedOption: string) => {
  console.log("Selected option:", selectedOption);
};

const meta = {
  title: "Components/SearchSuggestions",
  tags: ["autodocs"],
  argTypes: {
    id: {
      description: "The id of the Segmented Control.",
      control: { type: "text" },
    },
    dataTestId: {
      description: "The data-testid of the Segmented Control.",
      control: { type: "text" },
    },
    options: {
      description: "Pass the options to show in the Search suggestions.",
      control: { type: "array" },
    },
    optionsType: {
      description: "Pass the type of suggestions to show.",
      defaultValue: "history",
      control: { type: "radio" },
      options: ["history", "suggest"],
      mapping: {
        history: "history",
        suggest: "suggest",
      },
    },
  },
  render: (args) => {
    const [{ SearchSuggestion }] = useSearchSuggestions(args, onOptionClick);
    return <SearchSuggestion />;
  },
} satisfies Meta<React.FC<ISearchSuggestionsProps>>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: "example-id",
    dataTestId: "example-test-id",
    options: [{ text: "Option 1" }, { text: "Option 2" }, { text: "Option 3" }],
    optionsType: "history",
  },
};
