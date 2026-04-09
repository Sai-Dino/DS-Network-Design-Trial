import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Error, Add } from "@murv/icons";
import { TextInputStory, TextAreaStory } from "./InputStory";
import { TextBoxInput } from "./Input";

const meta = {
  title: "Components/Input",
  component: TextBoxInput,
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof TextInputStory>;

export default meta;
type Story = StoryObj<typeof meta>;

const commonProps = {
  value: "input values",
  placeholder: "Enter a value",
  onChange: () => {},
  label: "Label",
  helpText: "Help or instruction text goes here",
  maxLength: 30,
  compact: false,
  width: "300px",
  isError: false,
  prefixIcon: <Error />,
  onHover: () => {},
  onClick: () => {},
  actionIcon: <Add />,
  disabled: false,
  optional: true,
  type: "text",
} as const;

export const Primary: Story = {
  args: commonProps,
  render: (args) => {
    const [textValue, setTextValue] = useState<string>("input values");
    return (
      <TextInputStory
        {...args}
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
      />
    );
  },
};

export const InputForm: Story = {
  args: commonProps,
  render: (args) => {
    const [textValue, setTextValue] = useState<string>("input values");
    return (
      <div style={{ width: "600px" }}>
        <TextInputStory
          {...args}
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
          compact
          width="500px"
        />
        <TextInputStory
          {...args}
          value={textValue}
          onChange={(event) => setTextValue(event.target.value)}
          compact
          width="400px"
        />
      </div>
    );
  },
};

export const TextArea: Story = {
  args: commonProps,
  name: "Input Text Area",
  render: (args) => {
    const [textValue, setTextValue] = useState<string>("input values");
    return (
      <TextAreaStory
        {...args}
        value={textValue}
        onChange={(event) => setTextValue(event.target.value)}
      />
    );
  },
};

const dropdownProps = {
  value: "Filter",
  placeholder: "Select",
  onChange: () => {},
  label: "Label",
  helpText: "Help or instruction text goes here",
  compact: true,
  width: "300px",
  isError: false,
  onClick: () => {},
  actionIcon: <Add />,
  disabled: false,
  optional: true,
  inputHtmlProps: {
    readOnly: true,
  },
  type: "text",
} as const;

export const Dropdown: Story = {
  args: dropdownProps,
  name: "For Dropdown",
};
