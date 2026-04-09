import React, { useState } from "react";
import { Add } from "@murv/icons";
import { Meta, StoryObj } from "@storybook/react";
import { SingleSelect } from "./components/SingleSelect";

const meta: Meta = {
  title: "Components/SelectionPopover",
  component: SingleSelect,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleSelectWithSearch: Story = {
  render(props) {
    const [value, setValue] = useState("cycle");
    const onChange = (selectedValue: string) => {
      setValue(selectedValue);
    };
    return (
      <SingleSelect
        withSearch
        label="Select"
        options={props.options}
        name={props.name}
        showBadge={false}
        withBorder
        triggerType="filter"
        orientation="vertical"
        {...props}
        value={value}
        onChange={onChange}
        id={props.searchId}
        prefixButtonIcon={() => <Add />}
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
        value: "car ajhsbdf kjasbd",
      },
      {
        label: "Motorcycle",
        value: "motorcycle",
      },
      {
        label: "Bus",
        value: "bus",
      },
      {
        label: "Train",
        value: "train",
      },
    ],
    name: "vehicle",
    checkMarkPosition: "right",
    searchId: "search",
  },
};

export const SingleSelectWithoutSearch: Story = {
  render(props) {
    const [value, setValue] = useState("cycle");
    return (
      <SingleSelect
        label="select"
        options={props.options}
        name={props.name}
        {...props}
        value={value}
        onChange={(selectedValue) => {
          setValue(selectedValue);
        }}
        id={props.searchId}
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
    searchId: "search",
  },
};

export const SingleSelectHorizontal: Story = {
  render(props) {
    const [value, setValue] = useState("");
    return (
      <SingleSelect
        label="Select"
        orientation="horizontal"
        options={props.options}
        name={props.name}
        {...props}
        value={value}
        onChange={(selectedValue) => {
          setValue(selectedValue);
        }}
        id={props.searchId}
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
    searchId: "search",
  },
};

export const SingleSelectDisabled: Story = {
  render(props) {
    const [value, setValue] = useState("");
    return (
      <SingleSelect
        label="Select"
        options={props.options}
        name={props.name}
        {...props}
        value={value}
        onChange={(selectedValue) => {
          setValue(selectedValue);
        }}
        id={props.searchId}
        disabled
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
  },
};

export const SingleSelectWithAsyncLoading: Story = {
  render(props) {
    const [value, setValue] = useState("cycle");
    const [loading, setLoading] = useState(false);
    const [options, setOptions] = useState(props.options);
    const onChange = (selectedValue: string) => {
      setValue(selectedValue);
    };

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
          {
            label: "Car",
            value: "car",
          },
        ]);
      }, 1000); // Simulate 1 second delay
    };

    return (
      <SingleSelect
        withSearch
        label="Select"
        name={props.name}
        showBadge={false}
        withBorder
        triggerType="filter"
        orientation="vertical"
        {...props}
        value={value}
        onChange={onChange}
        id={props.searchId}
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
      {
        label: "Motorcycle",
        value: "motorcycle",
      },
      {
        label: "Bus",
        value: "bus",
      },
      {
        label: "Train",
        value: "train",
      },
    ],
    name: "vehicle",
    checkMarkPosition: "right",
    searchId: "search",
  },
};
