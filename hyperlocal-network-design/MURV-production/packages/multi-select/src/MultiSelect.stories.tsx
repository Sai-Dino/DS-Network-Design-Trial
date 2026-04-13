import React, { useState } from "react";
import type { StoryObj, Meta } from "@storybook/react";
import { MultiSelect } from ".";

const optionsBasic = [
  {
    label: "Parent1",
    value: "Parent1_Value",
    id: "1",
  },
  {
    label: "Parent2",
    value: "Parent2_Value",
    id: "2",
  },
  {
    label: "Parent3",
    value: "Parent3_Value",
    id: "3",
  },
  {
    label: "Parent4",
    value: "Parent4_Value",
    id: "4",
  },
  {
    label: "Parent5",
    value: "Parent5_Value",
    id: "5",
  },
];

const optionsNested = [
  {
    label: "Parent1",
    value: "Parent1_Value",
    id: "1",
    children: [
      {
        label: "Child p1.c1",
        id: "2",
        value: "Child_p1.c1_Value",
        children: [
          {
            label: "Grandchild p1.c1.gc1 very long warehouse name",
            id: "6",
            value: "Grandchild_p1.c1.gc1_Value",
          },
          {
            label: "Grandchild p1.c1.gc2",
            id: "7",
            value: "Grandchild_p1.c1.gc2_Value",
          },
          {
            label: "Random p1.c1.gc2",
            id: "78",
            value: "Random_p1.c1.gc2_Value",
          },
        ],
      },
      {
        label: "Child p1.c2",
        id: "3",
        value: "Child_p1.c2_Value",
        children: [
          {
            label: "Grandchild p1.c2.gc1",
            id: "8",
            value: "Grandchild_p1.c2.gc1_Value",
          },
        ],
      },
      {
        label: "Child p1.c3",
        id: "4",
        value: "Child_p1.c3_Value",
        children: [
          {
            label: "Grandchild p1.c3.gc1",
            id: "9",
            value: "Grandchild_p1.c3.gc1_Value",
          },
          {
            label: "Grandchild p1.c3.gc2",
            id: "10",
            value: "Grandchild_p1.c3.gc2_Value",
          },
        ],
      },
    ],
  },
  {
    label: "Parent2",
    value: "Parent2_Value",
    id: "90",
    children: [
      {
        label: "Child p2.c1",
        id: "11",
        value: "Child_p2.c1_Value",
      },
      {
        label: "Child p2.c2",
        id: "12",
        value: "Child_p2.c2_Value",
      },
    ],
  },
];

// 3000 leaf items across 30 parent groups (100 children each).
// Defined outside the component so the reference is stable across re-renders.
const optionsLargeFlat = Array.from({ length: 3000 }, (_, i) => ({
  id: `flat-${i}`,
  label: `Item ${i + 1}`,
  value: `item_${i + 1}`,
}));

const optionsLargeGrouped = Array.from({ length: 30 }, (_, g) => ({
  id: `group-${g}`,
  label: `Group ${g + 1}`,
  value: `group_${g + 1}`,
  children: Array.from({ length: 100 }, (_item, c) => ({
    id: `group-${g}-item-${c}`,
    label: `Group ${g + 1} › Item ${c + 1}`,
    value: `group_${g + 1}_item_${c + 1}`,
  })),
}));

const meta = {
  title: "Components/MultiSelect",
  component: MultiSelect,
  tags: ["autodocs"],
} satisfies Meta<typeof MultiSelect>;

export default meta;

type Story = StoryObj<typeof MultiSelect>;

export const MultiSelectBasic: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Warehouses"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsBasic}
        withBorder
        showBadge={false}
        triggerType="filter"
      />
    );
  },
  args: {},
};

export const MultiSelectNested: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Categories"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsNested}
      />
    );
  },
  args: {},
};

export const MultiSelectWithDoneAndClear: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Categories"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsNested}
        onApply={(selectedItems) => {
          console.log("applied", selectedItems);
        }}
        onClear={() => {
          console.log("cleared trigger");
        }}
        disableApply={selected.length === 0}
      />
    );
  },
  args: {},
};

export const MultiSelectDisabled: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>(["Parent1_Value"]);

    return (
      <MultiSelect
        name="Warehouses"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsBasic}
        withBorder
        disabled
      />
    );
  },
  args: {},
};

export const MultiSelectAsyncLoading: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Warehouses"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsBasic}
        withBorder
        showBadge={false}
        triggerType="filter"
        onHandleSearch={(value) => console.log(value)}
        isLoading
      />
    );
  },
  args: {},
};

export const MultiSelectLargeFlat: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Items (3000 flat)"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsLargeFlat}
        withBorder
      />
    );
  },
  args: {},
};

export const MultiSelectLargeGrouped: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <MultiSelect
        name="Items (30 groups × 100)"
        selected={selected}
        onSelect={setSelected}
        nodes={optionsLargeGrouped}
        withBorder
      />
    );
  },
  args: {},
};
