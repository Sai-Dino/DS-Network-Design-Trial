import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { CheckBoxTreeFilter } from ".";

const options = [
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
            label: "Grandchild p1.c1.gc1",
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
    id: "5",
    value: "Parent2_Value",
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
  {
    label: "Parent3",
    value: "Parent3_Value",
    children: [
      {
        label: "Child p3.c1",
        value: "Child_p3.c1_Value",
        children: [
          {
            label: "GrandChild p3.c1.gc1",
            value: "GrandChild_p3.c1.gc1_Value",
          },
          {
            label: "GrandChild Clone",
            value: "GrandChild_Clone",
          },
          {
            label: "GrandChild p3.c1.gc3",
            value: "GrandChild_p3.c1.gc3_Value",
          },
        ],
      },
      {
        label: "Child p3.c2",
        value: "Child_p3.c2_Value",
        children: [
          {
            label: "GrandChild Clone",
            value: "GrandChild_Clone",
          },
          {
            label: "GrandChild p3.c2.gc2",
            value: "GrandChild_p3.c2.gc2_Value",
          },
          {
            label: "GrandChild p3.c2.gc3",
            value: "GrandChild_p3.c2.gc3_Value",
          },
        ],
      },
    ],
  },
];

// 5000 flat leaf nodes — defined at module level so the reference is stable.
const largeFlatNodes = Array.from({ length: 5000 }, (_, i) => ({
  id: `flat-${i}`,
  label: `Item ${i + 1}`,
  value: `item_${i + 1}`,
}));

// 50 parent groups × 100 children each = 5000 leaf nodes.
const largeGroupedNodes = Array.from({ length: 50 }, (_, g) => ({
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
  title: "Components/CheckBoxTree",
  component: CheckBoxTreeFilter,
  tags: ["autodocs"],
} satisfies Meta<typeof CheckBoxTreeFilter>;

export default meta;

type Story = StoryObj<typeof CheckBoxTreeFilter>;

export const CheckboxTreeFilter: Story = {
  render(props) {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <div
        style={{
          width: "280px",
          borderRadius: "8px",
          border: "1px solid #eee",
          boxShadow: "0px 4px 8px 4px #00000014",
          height: "300px",
          overflow: "clip",
        }}
      >
        <CheckBoxTreeFilter {...props} selected={selected} onSelect={setSelected} />
      </div>
    );
  },
  args: {
    nodes: options,
  },
};

export const LargeFlat: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <div
        style={{
          width: "280px",
          borderRadius: "8px",
          border: "1px solid #eee",
          boxShadow: "0px 4px 8px 4px #00000014",
          height: "300px",
          overflow: "clip",
        }}
      >
        <CheckBoxTreeFilter nodes={largeFlatNodes} selected={selected} onSelect={setSelected} />
      </div>
    );
  },
  args: {},
};

export const LargeGrouped: Story = {
  render() {
    const [selected, setSelected] = useState<string[]>([]);

    return (
      <div
        style={{
          width: "280px",
          borderRadius: "8px",
          border: "1px solid #eee",
          boxShadow: "0px 4px 8px 4px #00000014",
          height: "300px",
          overflow: "clip",
        }}
      >
        <CheckBoxTreeFilter nodes={largeGroupedNodes} selected={selected} onSelect={setSelected} />
      </div>
    );
  },
  args: {},
};

export const WithSearchAsync: Story = {
  render(props) {
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [nodes, setNodes] = useState(props.nodes);

    const onHandleSearch = (search: string) => {
      console.log("Searching for:", search);
      setLoading(true);
      setTimeout(() => {
        console.log("Resolved search:", search);
        setLoading(false);
        setNodes(
          search
            ? [
                {
                  label: "Cycle",
                  id: "cycle",
                  value: "cycle",
                },
                { label: "Bike", value: "bike", id: "bike" },
              ]
            : props.nodes,
        );
      }, 1000); // Simulate 1 second delay
    };
    return (
      <CheckBoxTreeFilter
        {...props}
        isLoading={loading}
        onHandleSearch={onHandleSearch}
        nodes={nodes}
        selected={selected}
        onSelect={setSelected}
      />
    );
  },
  args: {
    nodes: options,
  },
};
