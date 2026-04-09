import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckMarkGroup } from "./CheckMarkGroup";
import CheckMarkGroupWithSearch from "./CheckMarkGroupWithSearch";

const meta = {
  title: "Components/CheckMark",
  component: CheckMarkGroup,
  tags: ["autodocs"],
} satisfies Meta<typeof CheckMarkGroup>;

export default meta;

type Story = StoryObj<typeof CheckMarkGroup>;

export const UnControlled: Story = {
  args: {
    orientation: "vertical",
    options: [
      { label: "Apple", value: "apple", description: "keeps away from doctor!" },
      {
        label: "Orange",
        value: "orange",
        description: "Vitamic C",
        inputProps: {
          defaultChecked: true,
        },
      },
    ],
    name: "fruit",
    onChange: undefined,
  },
};

export const Controlled: Story = {
  render(props) {
    const [value, setValue] = useState("cycle");

    return (
      <CheckMarkGroup
        {...props}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          console.log("value", value);
        }}
      />
    );
  },
  args: {
    options: [
      {
        label: "Cycle",
        value: "cycle",
        description: "Good for health",
      },
      { label: "Bike", value: "bike" },
      {
        label: "Car",
        value: "car",
      },
    ],
    name: "vehicle",
    checkMarkPosition: "right",
    style: {
      width: "300px",
    },
  },
};

export const WithSearch: Story = {
  render(props) {
    const [value, setValue] = useState("");

    return (
      <CheckMarkGroupWithSearch
        {...props}
        value={value}
        showCheckedValue
        onChange={(e) => setValue(e.target.value)}
        id="searchId"
      />
    );
  },
  args: {
    options: [
      {
        label: "Cycle",
        value: "cycle",
      },
      { label: "Bike", value: "bike" },
      {
        label: "Car",
        value: "car",
      },
    ],
    name: "vehicle",
    checkMarkPosition: "right",
    style: {
      width: "300px",
    },
  },
};

export const WithSearchAsync: Story = {
  render(props) {
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState(props.options);

    const onHandleSearch = (search: string) => {
      console.log("Searching for:", search);
      setLoading(true);
      setTimeout(() => {
        console.log("Resolved search:", search);
        setLoading(false);
        setOptions([
          {
            label: "Cycle",
            value: "cycle",
          },
          { label: "Bike", value: "bike" },
        ]);
      }, 1000); // Simulate 1 second delay
    };

    return (
      <CheckMarkGroupWithSearch
        {...props}
        value={value}
        showCheckedValue
        onChange={(e) => setValue(e.target.value)}
        id="searchId"
        onHandleSearch={onHandleSearch}
        isLoading={loading}
        options={options}
      />
    );
  },
  args: {
    options: [
      {
        label: "Cycle",
        value: "cycle",
      },
      { label: "Bike", value: "bike" },
      {
        label: "Car",
        value: "car",
      },
    ],
    name: "vehicle",
    checkMarkPosition: "right",
    style: {
      width: "300px",
    },
  },
};
