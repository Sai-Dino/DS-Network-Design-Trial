import { RenderResult, render, fireEvent } from "test-utils";
import React, { useState } from "react";
import "@testing-library/jest-dom";
import { CheckBoxTreeFilter } from "..";
import { ITreeNode } from "../types";

const options: ITreeNode[] = [
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
    id: "13",
    value: "Parent3_Value",
    children: [
      {
        label: "Child p3.c1",
        id: "14",
        value: "Child_p3.c1_Value",
        children: [
          {
            label: "GrandChild p3.c1.gc1",
            id: "16",
            value: "GrandChild_p3.c1.gc1_Value",
          },
          {
            label: "GrandChild Clone 1",
            id: "17",
            value: "GrandChild_Clone_Value",
          },
          {
            label: "GrandChild p3.c1.gc3",
            id: "18",
            value: "GrandChild_p3.c1.gc3_Value",
          },
        ],
      },
      {
        label: "Child p3.c2",
        id: "15",
        value: "Child_p3.c2_Value",
        children: [
          {
            label: "GrandChild Clone 2",
            id: "19",
            value: "GrandChild_Clone_Value",
          },
          {
            label: "GrandChild p3.c2.gc2",
            id: "20",
            value: "GrandChild_p3.c2.gc2_Value",
          },
          {
            label: "GrandChild p3.c2.gc3",
            id: "21",
            value: "GrandChild_p3.c2.gc3_Value",
          },
        ],
      },
    ],
  },
];

const WrappedControlledComponent = () => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <CheckBoxTreeFilter
      id="checkBoxTreeTest"
      nodes={options}
      selected={selected}
      onSelect={setSelected}
      dataTestId="checkBoxTreeTest"
    />
  );
};

describe("Checkbox tree", () => {
  let screen = {} as RenderResult;

  // jsdom has no layout engine — offsetHeight is 0 by default, so the
  // virtualizer computes an empty visible range and renders nothing.
  // Give every HTMLElement a large enough height so all tree items render.
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 9999,
    });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 0,
    });
  });

  beforeEach(() => {
    screen = render(<WrappedControlledComponent />);
  });

  test("renders as expected", () => {
    const checkBoxTreeFilter = screen?.getByTestId("checkBoxTreeTest");
    expect(checkBoxTreeFilter).toBeInTheDocument();

    const checkBoxTreeFilterSearch = screen?.getByPlaceholderText("Search Paramter");
    expect(checkBoxTreeFilterSearch).toBeInTheDocument();

    const checkBoxTree = screen?.getByTestId("checkbox-tree-checkBoxTreeTest");
    expect(checkBoxTree).toBeInTheDocument();

    const checkBoxTreeOption = screen?.getByLabelText("Child p1.c1");
    expect(checkBoxTreeOption).toBeInTheDocument();
  });

  test("leaf node gets checked", () => {
    const checkBoxTreeOption = screen?.getByLabelText("Grandchild p1.c2.gc1");
    fireEvent.click(checkBoxTreeOption);

    const checkBoxTreeValue = screen?.getByDisplayValue("8");
    expect(checkBoxTreeValue).toBeChecked();
  });

  test("All leaf nodes checked = Parent node checked", () => {
    const checkBoxTreeOption = screen?.getByLabelText("Grandchild p1.c2.gc1");
    fireEvent.click(checkBoxTreeOption);

    const checkBoxTreeValue = screen?.getByDisplayValue("3");
    expect(checkBoxTreeValue).toBeChecked();
  });

  test("Parent node checked = All leaf nodes checked", () => {
    const checkBoxTreeOption = screen?.getByLabelText("Parent2");
    fireEvent.click(checkBoxTreeOption);
    const parentOption = options.find((option) => option?.label === "Parent2");

    if (parentOption?.children)
      parentOption?.children.forEach((childOption) => {
        const checkBoxTreeValue = screen?.getByDisplayValue(childOption.id as string);
        expect(checkBoxTreeValue).toBeChecked();
      });
  });

  test("Some All = All nodes checked", () => {
    const selectAllOption = screen?.getByLabelText("Select All");
    fireEvent.click(selectAllOption);

    const checkChecked = (_options: ITreeNode[]) => {
      _options.forEach((_option) => {
        const checkBoxTreeValue = screen?.getByDisplayValue(_option.id as string);
        expect(checkBoxTreeValue).toBeChecked();
        if (_option?.children?.length) {
          checkChecked(_option?.children);
        }
      });
    };

    checkChecked(options);
  });

  test("Duplicate value nodes checked are in sync", () => {
    const checkBoxTreeOptionClone1 = screen?.getByLabelText("GrandChild Clone 1");
    fireEvent.click(checkBoxTreeOptionClone1);

    const checkBoxTreeOptionClone2 = screen?.getByLabelText("GrandChild Clone 2");
    expect(checkBoxTreeOptionClone1).toBeChecked();
    expect(checkBoxTreeOptionClone2).toBeChecked();

    fireEvent.click(checkBoxTreeOptionClone2);
    expect(checkBoxTreeOptionClone1).not.toBeChecked();
    expect(checkBoxTreeOptionClone2).not.toBeChecked();

    const checkBoxTreeOptionClone1Parent = screen?.getByLabelText("Child p3.c1");
    fireEvent.click(checkBoxTreeOptionClone1Parent);
    expect(checkBoxTreeOptionClone1).toBeChecked();
    expect(checkBoxTreeOptionClone2).toBeChecked();

    const checkBoxTreeOptionClone2Parent = screen?.getByLabelText("Child p3.c2");
    // clone2 parent is partially checked
    fireEvent.click(checkBoxTreeOptionClone2Parent); // now its completely checked
    fireEvent.click(checkBoxTreeOptionClone2Parent); // now its completely unchecked
    expect(checkBoxTreeOptionClone1).not.toBeChecked();
    expect(checkBoxTreeOptionClone2).not.toBeChecked();
  });

  // test("Checkbox tree snap shot testing", () => {
  //   expect(screen?.asFragment()).toMatchSnapshot();
  // });

  afterEach(() => {
    screen.unmount();
  });
});
