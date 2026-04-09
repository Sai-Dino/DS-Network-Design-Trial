import { AddTask, Delete } from "@murv/icons";
import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { PillsBar } from "./components/PillsBar";
import { TPillsBarProps } from "./types";

const PillsData = [
  { label: "Pill 1", value: "Pill_1" },
  { label: "Pill 2", value: "Pill_2" },
  { label: "Pill 3", value: "Pill_3" },
  { label: "Pill 4", value: "Pill_4" },
  { label: "Pill 5", value: "Pill_5" },
  { label: "Pill 6", value: "Pill_6" },
  { label: "Pill 7", value: "Pill_7" },
  { label: "Pill 8", value: "Pill_8" },
  { label: "Pill 9", value: "Pill_9" },
  { label: "Pill 10", value: "Pill_10" },
];

const meta = {
  title: "Components/PillsBar",
  component: PillsBar,
  tags: ["autodocs"],
  argTypes: {
    gap: {
      description: "The gap between the Pills.",
      defaultValue: "4px",
    },
    isPrefixReplaceable: {
      description: "Is the Prefix icon is replacable",
      defaultValue: false,
    },
    dataTestId: {
      description: "Test id for the bar.",
      defaultValue: "pillsbar-storybook-ui-container",
    },
    isMultiSelect: {
      description: "Pills will be single or multi select.",
      defaultValue: false,
    },
    paddingVertical: {
      description: "The Vertical space between pills and the container.",
      defaultValue: "4px",
    },
    paddingHorizontal: {
      description: "The Horizontal space between pills and the container.",
      defaultValue: "4px",
    },
    isScroll: {
      description: "Pills inside the container can be scrolled or wrapped to the next row.",
      defaultValue: false,
    },
    selectedPills: {
      description:
        "In this props pass the secleted value of pill to the do the default seclected. ",
      defaultValue: [] || "",
    },
    onSelectedChange: {
      description: "Its a callback that will return the selected pills to the consumer.",
      defaultValue: () => {},
    },
  },
} satisfies Meta<TPillsBarProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // @ts-ignore
  args: {
    isScroll: true,
    isMultiSelect: false,
  },
  render: (args) => {
    const [seclected, setSeclected] = useState("");
    return (
      <PillsBar
        {...args}
        dataTestId="pillsbar-storybook-ui-container"
        isMultiSelect={false}
        selectedPills={seclected}
        onSelectedChange={(pills: any) => setSeclected(pills)}
      >
        <PillsBar.Pill label="Pill 1" value="pill_1" />
        <PillsBar.Pill label="Pill 2" value="pill_2" />
        <PillsBar.Pill label="Pill 3" value="pill_3" />
      </PillsBar>
    );
  },
  name: "Default Pills Bar",
};

export const PillBarWithPrefixIcon: Story = {
  // @ts-ignore
  args: {
    isScroll: true,
    isPrefixReplaceable: true,
  },
  render: (args) => {
    const [seclected, setSeclected] = useState([]);
    return (
      <PillsBar
        {...args}
        isMultiSelect
        selectedPills={seclected}
        onSelectedChange={(pills: any) => setSeclected(pills)}
        dataTestId="pillsbar-storybook-ui-container"
      >
        <PillsBar.Pill prefixIcon={<AddTask />} label="Pill 1" value="pill_1" />
        <PillsBar.Pill prefixIcon={<AddTask />} label="Pill 2" value="pill_2" />
        <PillsBar.Pill prefixIcon={<AddTask />} label="Pill 3" value="pill_3" />
      </PillsBar>
    );
  },
  name: "Pills Bar with Prefix Icon",
};

export const PillBarWithActionIcon: Story = {
  // @ts-ignore
  args: {
    isScroll: true,
  },
  render: (args) => {
    const [seclected, setSeclected] = useState("");
    return (
      <PillsBar
        {...args}
        isMultiSelect={false}
        selectedPills={seclected}
        onSelectedChange={(pills: any) => setSeclected(pills)}
        dataTestId="pillsbar-storybook-ui-container"
      >
        <PillsBar.Pill
          prefixIcon={<AddTask />}
          suffixIcon={<Delete />}
          label="Pill 1"
          value="pill_1"
        />
        <PillsBar.Pill
          prefixIcon={<AddTask />}
          suffixIcon={<Delete />}
          label="Pill 2"
          value="pill_2"
        />
        <PillsBar.Pill
          prefixIcon={<AddTask />}
          suffixIcon={<Delete />}
          label="Pill 3"
          value="pill_3"
        />
      </PillsBar>
    );
  },
  name: "Pills Bar with Action Icon",
};

export const WrapperPillBar: Story = {
  // @ts-ignore
  args: {
    isPrefixReplaceable: true,
  },
  render: (args) => {
    const [Pills, setPills] = useState(PillsData);
    const [seclected, setSeclected] = useState("");
    return (
      <PillsBar
        {...args}
        isMultiSelect={false}
        selectedPills={seclected}
        onSelectedChange={(pills: any) => setSeclected(pills)}
        dataTestId="pillsbar-storybook-ui-container"
      >
        {Pills.map((item) => (
          <PillsBar.Pill
            prefixIcon={<AddTask />}
            suffixIcon={<Delete />}
            suffixIconCallBack={() => setPills(Pills.filter((i) => i !== item))}
            label={item.label}
            value={item.value}
          />
        ))}
      </PillsBar>
    );
  },
  name: "Pills Bar with Wrapped pills",
};
