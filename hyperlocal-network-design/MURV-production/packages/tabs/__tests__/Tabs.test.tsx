import React from "react";
import { act, renderHook } from "@testing-library/react-hooks";
import { render } from "test-utils";
import { CheckCircle, Close } from "@murv/icons";
import { ITab, useTabs } from "../src";
import {
  createTabItemTestId,
  createTabPanelTestId,
  createTabPrefixIconTestId,
  createTabSuffixIconTestId,
  createTabTagTestId,
} from "../src/utils";
import { TABPANEL_VISIBILITY_TYPES } from "../src/constants";

const createSamplePanelContentTestId = (tabId: string) => `tabs-sample-panel-content-${tabId}`;

const suffixIconMockFunction = jest.fn();

export const tabsList: ITab[] = [
  {
    title: "Tab 1",
    value: "tab_one",
    content: <div>Tab 1 Content</div>,
    prefixIcon: {
      icon: <CheckCircle fill />,
      ariaLabel: "Recommended!",
    },
  },
  {
    title: "Tab 2",
    value: "tab_two",
    content: <div>Tab 2 Content</div>,
    suffixIcon: {
      icon: <Close />,
      ariaLabel: "Recommended!",
      onClick: () => {},
    },
  },
  {
    title: "Tab 3",
    value: "tab_three",
    content: <div>Tab 3 Content</div>,
    tag: { tagText: "NEW", tagStyle: "red" },
  },
  {
    title: "Tab 4",
    value: "tab_four",
    content: <div>Tab 4 Content</div>,
    prefixIcon: {
      icon: <CheckCircle fill />,
      ariaLabel: "Recommended!",
    },
    tag: { tagText: "NEW", tagStyle: "red" },
    suffixIcon: {
      icon: <Close />,
      ariaLabel: "Recommended!",
      onClick: suffixIconMockFunction,
    },
  },
  {
    title: "Tab 5",
    value: "tab_five",
    content: <div>Tab 5 Content</div>,
    prefixIcon: {
      icon: <CheckCircle fill />,
      ariaLabel: "Recommended!",
    },
    tag: { tagText: "NEW", tagStyle: "red" },
    suffixIcon: {
      icon: <Close />,
      ariaLabel: "Recommended!",
      onClick: () => {},
    },
    disabled: true,
  },
];

describe("useTabs", () => {
  test("should return the tab components & tab controls as expected", () => {
    const { result } = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
          },
        ],
      },
    );
    expect(result.current).toBeDefined();
    expect(result.current.length).toBe(2);
    expect(result.current[1].selectedTab).toBe("tab_one");
  });

  test("should initialize the selectedTab state to initSelectedTab when passed", () => {
    const {
      result: {
        current: [, { selectedTab }],
      },
    } = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
            initSelectedTab: "tab_two",
          },
        ],
      },
    );
    expect(selectedTab).toBe("tab_two");
  });

  test("should update the selectedTab state when setSelectedTab is invoked with a valid tab", async () => {
    const {
      result: {
        current: [, { selectedTab, setSelectedTab }],
      },
      waitFor,
    } = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
          },
        ],
      },
    );
    act(() => {
      setSelectedTab("tab_three");
    });
    await waitFor(() => expect(selectedTab).toBe("tab_three"));
  });

  test("should not update the selectedTab state when setSelectedTab is invoked with an invalid tab", async () => {
    const {
      result: {
        current: [, { selectedTab, setSelectedTab }],
      },
      waitFor,
    } = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
          },
        ],
      },
    );
    act(() => {
      setSelectedTab("random_invalid_tab");
    });
    await waitFor(() => expect(selectedTab).toBe("tab_one"));
  });
});

describe("Tab Panels", () => {
  const dataTestId = "sample_tabs";

  const renderTabs = (
    overrideArgs?: ReturnType<typeof useTabs>[0]["TabBar"]["defaultProps"] &
      ReturnType<typeof useTabs>[0]["TabContentPanel"]["defaultProps"],
  ) => {
    const renderHookResult = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
          },
        ],
      },
    );
    const {
      result: {
        current: [Tabs, tabControls],
      },
    } = renderHookResult;
    const renderResult = render(
      <div>
        <h3 id="sample_tabs_label">Sample tab test</h3>
        <Tabs.TabBar
          {...tabControls}
          ariaLabelledBy="sample_tabs_label"
          dataTestId={dataTestId}
          {...overrideArgs}
        />
        <Tabs.TabContentPanel {...tabControls} {...overrideArgs} dataTestId={dataTestId} />
      </div>,
    );

    return [renderHookResult, renderResult] as const;
  };

  test("render as expected", () => {
    const [{ waitFor }, doc] = renderTabs();

    const firstPanelNode = doc.getByTestId(createTabPanelTestId(dataTestId, "tab_one"));
    waitFor(() => expect(firstPanelNode).toBeDefined());
    waitFor(() => expect(firstPanelNode.ariaHidden).toBe(false));
    waitFor(() => expect(firstPanelNode.role).toBe("tabpanel"));
    waitFor(() =>
      expect(firstPanelNode.getAttribute("aria-labelledby")).toBe(
        createTabItemTestId(dataTestId, "tab_one"),
      ),
    );

    const secondPanelNode = doc.getByTestId(createTabPanelTestId(dataTestId, "tab_two"));
    waitFor(() => expect(secondPanelNode).toBeDefined());
    waitFor(() => expect(secondPanelNode.ariaHidden).toBe(true));
    waitFor(() => expect(secondPanelNode.role).toBe("tabpanel"));
    waitFor(() =>
      expect(secondPanelNode.getAttribute("aria-labelledby")).toBe(
        createTabItemTestId(dataTestId, "tab_two"),
      ),
    );
  });

  test("hides & actives panels in response to click events on the tabs", () => {
    const [{ waitFor }, doc] = renderTabs();
    const secondTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_two"));
    secondTabNode.click();

    const secondPanelNode = doc.getByTestId(createTabPanelTestId(dataTestId, "tab_two"));
    waitFor(() => expect(secondPanelNode.ariaHidden).toBe(false));
    const firstPanelNode = doc.getByTestId(createTabPanelTestId(dataTestId, "tab_one"));
    waitFor(() => expect(firstPanelNode.ariaHidden).toBe(true));
  });

  test(`render as expected with the panelVisibilityType: ${TABPANEL_VISIBILITY_TYPES.EAGER_RENDER_HIDE_INACTIVE}`, () => {
    const [{ waitFor }, doc] = renderTabs({
      panelsVisibilityType: TABPANEL_VISIBILITY_TYPES.EAGER_RENDER_HIDE_INACTIVE,
    });

    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_one"))).toBeDefined());
    waitFor(() =>
      expect(doc.getByTestId(createTabPanelTestId(dataTestId, "tab_one")).ariaHidden).toBe(false),
    );
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_one")).parentElement?.hidden).toBe(
        false,
      ),
    );

    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_two"))).toBeDefined());
    waitFor(() =>
      expect(doc.getByTestId(createTabPanelTestId(dataTestId, "tab_two")).ariaHidden).toBe(true),
    );

    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_three"))).toBeDefined(),
    );
    waitFor(() =>
      expect(
        doc.getByTestId(createSamplePanelContentTestId("tab_four")).parentElement?.hidden,
      ).toBe(true),
    );
  });

  test(`render as expected with the panelVisibilityType: ${TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_HIDE_INACTIVE}`, () => {
    const [{ waitFor }, doc] = renderTabs({
      panelsVisibilityType: TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_HIDE_INACTIVE,
    });

    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_one"))).toBeDefined());
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_two"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_three"))).toBeUndefined(),
    );

    doc.getByTestId(createTabItemTestId(dataTestId, "tab_two")).click();
    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_one"))).toBeDefined());
    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_two"))).toBeDefined());
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_three"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_four"))).toBeUndefined(),
    );

    doc.getByTestId(createTabItemTestId(dataTestId, "tab_three")).click();
    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_one"))).toBeDefined());
    waitFor(() => expect(doc.getByTestId(createSamplePanelContentTestId("tab_two"))).toBeDefined());
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_three"))).toBeDefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createSamplePanelContentTestId("tab_four"))).toBeUndefined(),
    );
  });
});

describe("TabBar", () => {
  const dataTestId = "sample_tabs";
  const renderTabBar = () => {
    const renderHookResult = renderHook<Parameters<typeof useTabs>, ReturnType<typeof useTabs>>(
      (args) => useTabs(...args),
      {
        initialProps: [
          {
            tabs: tabsList,
          },
        ],
      },
    );
    const {
      result: {
        current: [Tabs, tabControls],
      },
    } = renderHookResult;
    const renderResult = render(
      <Tabs.TabBar {...tabControls} ariaLabel="Sample tab test" dataTestId={dataTestId} />,
    );

    return [renderHookResult, renderResult] as const;
  };

  test("renders as expected", () => {
    const [{ waitFor }, doc] = renderTabBar();

    const firstTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_one"));
    waitFor(() => expect(firstTabNode.ariaSelected).toBe(true));
    waitFor(() => expect(firstTabNode.tabIndex).toBe(0));
    waitFor(() =>
      expect(firstTabNode.getAttribute("aria-controls")).toBe(
        createTabPanelTestId(dataTestId, "tab_one"),
      ),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabPrefixIconTestId(dataTestId, "tab_one"))).toBeDefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabSuffixIconTestId(dataTestId, "tab_one"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabTagTestId(dataTestId, "tab_one"))).toBeUndefined(),
    );

    const secondTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_two"));
    waitFor(() => expect(secondTabNode.ariaSelected).toBe(false));
    waitFor(() => expect(secondTabNode.tabIndex).toBe(-1));
    waitFor(() =>
      expect(secondTabNode.getAttribute("aria-controls")).toBe(
        createTabPanelTestId(dataTestId, "tab_two"),
      ),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabPrefixIconTestId(dataTestId, "tab_two"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabSuffixIconTestId(dataTestId, "tab_two"))).toBeDefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabTagTestId(dataTestId, "tab_two"))).toBeUndefined(),
    );

    waitFor(() =>
      expect(doc.getByTestId(createTabPrefixIconTestId(dataTestId, "tab_three"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabSuffixIconTestId(dataTestId, "tab_three"))).toBeUndefined(),
    );
    waitFor(() =>
      expect(doc.getByTestId(createTabTagTestId(dataTestId, "tab_three"))).toBeDefined(),
    );

    const fifthTabNode = doc.getByTestId(
      createTabItemTestId(dataTestId, "tab_five"),
    ) as HTMLButtonElement;
    waitFor(() => expect(fifthTabNode.ariaDisabled).toBe(true));
    waitFor(() => expect(fifthTabNode.disabled).toBe(true));
  });

  test("changes the tab selection on click", () => {
    const [
      {
        result: {
          current: [, { selectedTab }],
        },
        waitFor,
      },
      doc,
    ] = renderTabBar();

    const secondTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_two"));
    secondTabNode.click();
    waitFor(() => expect(selectedTab).toBe("tab_two"));
  });

  test("responds to key board events as mandated by the WAI-ARIA standards for a tab experience", () => {
    const [
      {
        result: {
          current: [, { selectedTab }],
        },
        waitFor,
      },
      doc,
    ] = renderTabBar();

    const tabKeyEvent = new KeyboardEvent("keydown", { key: "Tab" });
    const rightArrowKeyEvent = new KeyboardEvent("keydown", { key: "ArrowRight" });
    const leftArrowKeyEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
    const spaceKeyEvent = new KeyboardEvent("keydown", { key: " " });
    const homeKeyEvent = new KeyboardEvent("keydown", { key: "Home" });
    const endKeyEvent = new KeyboardEvent("keydown", { key: "End" });

    doc.container.dispatchEvent(tabKeyEvent);
    const firstTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_one"));
    waitFor(() => expect(firstTabNode).toHaveFocus());

    firstTabNode.dispatchEvent(rightArrowKeyEvent);
    const secondTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_two"));
    waitFor(() => expect(secondTabNode).toHaveFocus());

    secondTabNode.dispatchEvent(spaceKeyEvent);
    waitFor(() => expect(selectedTab).toBe("tab_two"));

    secondTabNode.dispatchEvent(leftArrowKeyEvent);
    waitFor(() => expect(firstTabNode).toHaveFocus());

    firstTabNode.dispatchEvent(endKeyEvent);
    const fourthTabNode = doc.getByTestId(createTabItemTestId(dataTestId, "tab_four"));
    waitFor(() => expect(fourthTabNode).toHaveFocus());

    fourthTabNode.dispatchEvent(homeKeyEvent);
    waitFor(() => expect(firstTabNode).toHaveFocus());
  });

  test("renders a clickable secondary icon that functions as expected when configured", () => {
    const [{ waitFor }, doc] = renderTabBar();

    const fourthTabSuffixIconNode = doc.getByTestId(
      createTabSuffixIconTestId(dataTestId, "tab_four"),
    );

    fourthTabSuffixIconNode.click();
    waitFor(() => expect(suffixIconMockFunction).toBeCalled());

    const enterKeyEvent = new KeyboardEvent("keydown", { key: "Enter" });
    fourthTabSuffixIconNode.dispatchEvent(enterKeyEvent);
    waitFor(() => expect(suffixIconMockFunction).toBeCalledTimes(2));
  });
});
