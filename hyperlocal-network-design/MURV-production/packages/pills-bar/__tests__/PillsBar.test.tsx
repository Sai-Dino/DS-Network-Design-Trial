import React, { useState } from "react";
import { fireEvent, render, waitFor } from "test-utils";
import "@testing-library/react-hooks";
import { PillsBar } from "../src";

const tabKeyEvent = new KeyboardEvent("keydown", { key: "Tab" });

it("renders the pillBar and pills list must be rendered", () => {
  const { getAllByTestId } = render(
    <PillsBar
      isMultiSelect={false}
      onSelectedChange={() => {}}
      selectedPills="pill_1"
      dataTestId="default-Pill-bar"
    >
      <PillsBar.Pill testId="pill-test" label="Pill 1" value="pill_1" />
      <PillsBar.Pill testId="pill-test" label="Pill 2" value="pill_2" />
      <PillsBar.Pill testId="pill-test" label="Pill 3" value="pill_3" />
    </PillsBar>,
  );
  expect(getAllByTestId("pill-test")).toHaveLength(3);
});

const SingleSelectPillBarStoryLoad = () => (
  <PillsBar
    isMultiSelect
    onSelectedChange={() => {}}
    selectedPills={["pill_1", "pill_2"]}
    dataTestId="default-Pill-bar"
  >
    <PillsBar.Pill testId="pill-test-0" label="Pill 1" value="pill_1" />
    <PillsBar.Pill testId="pill-test-1" label="Pill 2" value="pill_2" />
    <PillsBar.Pill testId="pill-test-2" label="Pill 3" value="pill_3" />
    <PillsBar.Pill testId="pill-test-2" label="Pill 3" value="pill_3" />
  </PillsBar>
);
it("default single select", async () => {
  const { getByTestId } = render(<SingleSelectPillBarStoryLoad />);
  waitFor(() => expect(getByTestId("pill-test-0")).toHaveAttribute("aria-selected", "true"));
});
it("single select works", async () => {
  const { getByTestId, container } = render(<SingleSelectPillBarStoryLoad />);
  waitFor(() => expect(getByTestId("pill-test-0")).toHaveAttribute("aria-selected", "true"));
  const pill0 = await getByTestId("pill-test-0");
  const pill1 = await getByTestId("pill-test-1");
  pill0.focus();
  container.dispatchEvent(tabKeyEvent);
  waitFor(() => expect(pill1).toHaveFocus());
  fireEvent.click(pill1);
  expect(pill1).toHaveAttribute("aria-selected", "true");
});

const MultiSelectPillBarStoryLoad = () => (
  <PillsBar
    isMultiSelect
    onSelectedChange={() => {}}
    selectedPills={["pill_1", "pill_2"]}
    dataTestId="default-Pill-bar"
  >
    <PillsBar.Pill testId="pill-test-0" label="Pill 1" value="pill_1" />
    <PillsBar.Pill testId="pill-test-1" label="Pill 2" value="pill_2" />
    <PillsBar.Pill testId="pill-test-2" label="Pill 3" value="pill_3" />
  </PillsBar>
);
it("default multi Select", async () => {
  const { getByTestId } = render(<MultiSelectPillBarStoryLoad />);
  waitFor(() => expect(getByTestId("pill-test-0")).toHaveAttribute("aria-selected", "true"));
  waitFor(() => expect(getByTestId("pill-test-1")).toHaveAttribute("aria-selected", "true"));
});
it("multi Select works", async () => {
  const { getByTestId, container } = render(<MultiSelectPillBarStoryLoad />);
  const pill0 = await getByTestId("pill-test-0");
  const pill2 = await getByTestId("pill-test-2");

  pill0.focus();
  container.dispatchEvent(tabKeyEvent);
  container.dispatchEvent(tabKeyEvent);
  waitFor(() => expect(pill2).toHaveFocus());
  fireEvent.click(pill2);
  waitFor(() => expect(pill0).toHaveAttribute("aria-selected", "true"));
  waitFor(() => expect(getByTestId("pill-test-1")).toHaveAttribute("aria-selected", "true"));
  waitFor(() => expect(pill2).toHaveAttribute("aria-selected", "true"));
});

const Pills = [
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
const AddDeletePillBarStoryLoad = () => {
  const [pillsList, setPillsList] = useState(Pills);
  const RemoveAddItem = (item: any) => {
    if (item.selected) {
      setPillsList(pillsList.filter((itm) => itm.value !== item.value));
    }
    setPillsList([...pillsList, { label: "Pill 11", value: "Pill_11" }]);
  };
  return (
    <PillsBar
      onSelectedChange={() => {}}
      isMultiSelect={false}
      selectedPills="Pill_1"
      isPrefixReplaceable
      dataTestId="default-Pill-bar"
    >
      {pillsList.map((item, index) => (
        <PillsBar.Pill
          // eslint-disable-next-line react/no-array-index-key
          key={`pill${index}`}
          testId="pill-test"
          label={item.label}
          value={item.value}
          suffixIcon="add"
          prefixIcon="add"
          suffixIconCallBack={() => RemoveAddItem(item)}
        />
      ))}
    </PillsBar>
  );
};
it("delete Pills works", async () => {
  const { getAllByTestId } = render(<AddDeletePillBarStoryLoad />);
  const icons = getAllByTestId("suffix-icon");
  fireEvent.click(icons[0]);
  waitFor(() => expect(icons).toHaveLength(9));
});

it("Delete Pills works", async () => {
  const { getAllByTestId } = render(<AddDeletePillBarStoryLoad />);
  const icons = getAllByTestId("suffix-icon");
  fireEvent.click(icons[2]);
  waitFor(() => expect(icons).toHaveLength(11));
});
