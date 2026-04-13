import React, { useState } from "react";
import { Story, Meta } from "@storybook/react";
import { SearchWithOptions } from "./SearchWithOptions";
import { ISearchWithOptionsProps, TYPES } from "./types";

export default {
  title: "Components/SearchWithOptions",
  component: SearchWithOptions,
  argTypes: {
    orientation: {
      control: {
        type: "select",
        options: [TYPES.static, TYPES.standard],
      },
    },
  },
} as Meta;

const options = [
  { label: "Option 1", value: "option1" },
  { label: "Option 2", value: "option2" },
  { label: "Option 3", value: "option3" },
];

// Template for the component with controls to customize props
const Template: Story<ISearchWithOptionsProps> = (args) => {
  const [searchValue, setSearchValue] = useState({ searchValue: "", selectedOption: "" });

  const handleSearch = (value: { searchValue: string; selectedOption: string }) => {
    console.log("Search value:", value);
  };

  const handleReset = (value: { searchValue: string; selectedOption: string }) => {
    setSearchValue(value);
  };

  const onChange = (value: { searchValue: string; selectedOption: string }) => {
    setSearchValue(value);
  };

  return (
    <SearchWithOptions
      value={searchValue}
      onChange={onChange}
      onSearch={handleSearch}
      onReset={handleReset}
      width="300px"
      options={options}
      {...args}
    />
  );
};

// Story for the Static (Low Switching) variant
export const Static: Story<ISearchWithOptionsProps> = Template.bind({});
Static.args = {
  orientation: TYPES.static,
  searchComponentProps: {
    initialQuery: "",
  },
};

// Story for the Standard (High Switching) variant
export const Standard: Story<ISearchWithOptionsProps> = Template.bind({});
Standard.args = {
  orientation: TYPES.standard,
  searchComponentProps: {
    initialQuery: "",
  },
};
