import React, { useState } from "react";
import { StoryObj, Meta } from "@storybook/react";
import { Checkbox } from "./Checkbox";
import { CheckboxWithLabel } from "./CheckboxWithLabel";
import { CheckboxGroup } from "./CheckboxGroup";

const meta = {
  title: "Components/Checkbox",
  component: CheckboxGroup,
  tags: ["autodocs"],
} as Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultCheckbox: Story = {
  args: {
    id: "defaultCheckbox",
    name: "defaultCheckbox",
    disabled: false,
  },
  render(props) {
    const [isChecked, setIsChecked] = useState(false);

    const handleChange = () => {
      setIsChecked(!isChecked);
    };

    return <Checkbox {...props} checked={isChecked} onChange={handleChange} />;
  },
};

export const CheckedCheckbox: Story = {
  args: {
    id: "defaultCheckbox",
    name: "defaultCheckbox",
    disabled: false,
    checked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const IndeterminateCheckbox: Story = {
  args: {
    id: "defaultCheckbox",
    name: "defaultCheckbox",
    disabled: false,
    indeterminate: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const DisabledCheckedCheckbox: Story = {
  args: {
    id: "defaultCheckbox",
    name: "defaultCheckbox",
    disabled: true,
    checked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const DisabledUncheckedCheckbox: Story = {
  args: {
    id: "defaultCheckbox",
    name: "defaultCheckbox",
    disabled: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const CheckboxLabel: Story = {
  args: {
    id: "checkbox",
    label: "Checkbox Label",
    description: "Add description here",
    name: "checkbox",
    checkboxPosition: "left",
    value: "",
  },
  render(props) {
    const [isChecked, setIsChecked] = useState(false);

    const handleChange = () => {
      console.log("is checked", isChecked);
      setIsChecked(!isChecked);
    };

    return (
      <CheckboxWithLabel id="checkbox" {...props} checked={isChecked} onChange={handleChange} />
    );
  },
};

export const CheckboxGrouped: Story = {
  render(props) {
    const [value, setValue] = useState([]);

    return (
      <CheckboxGroup
        options={[]}
        dataTestId="test-id"
        {...props}
        value={value}
        onChange={(e) => {
          let finalValue: string[] = [];
          if (e.target.checked) finalValue = [...value, e.target.value];
          else finalValue = value.filter((val) => val !== e.target.value);
          // @ts-ignore
          setValue(finalValue);
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
      {
        label: "Bike",
        value: "bike",
        description: "Good for health",
      },
      {
        label: "Car",
        value: "car",
      },
    ],
    checkboxPosition: "left",
    orientation: "horizontal",
  },
};
