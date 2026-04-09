import React, { useCallback, useMemo, useRef, KeyboardEvent } from "react";
import { ITab, ITabListProps } from "./types";
import { TabBarBase } from "./styles";
import { Tab } from "./Tab";
import { TAB_VARIANTS } from "./constants";
import { createTabItemTestId } from "./utils";

const initializeTabRefs = (tabs: ITab[]) => {
  const nonDisabledTabs = tabs.filter(({ disabled = false }) => !disabled);
  return {
    firstTabValue: nonDisabledTabs[0]?.value ?? "",
    lastTabValue: nonDisabledTabs.slice(-1)[0]?.value ?? "",
    tabNodes: nonDisabledTabs
      .map(({ value }, tabIndex, currArray) => ({
        value,
        nextTab: currArray[(tabIndex + 1) % currArray.length].value,
        prevTab: currArray[(tabIndex - 1 + currArray.length) % currArray.length].value,
      }))
      .reduce((result, next) => ({ ...result, [next.value]: { ...next, node: null } }), {}),
  };
};

export function TabList(props: ITabListProps) {
  const {
    tabs,
    selectedTab,
    setSelectedTab,
    variant,
    shiftFocusToTabPanel,
    tabsInstanceId,
    dataTestId = tabsInstanceId,
    ...remainingProps
  } = props;

  const tabRefs = useRef<{
    firstTabValue: string;
    lastTabValue: string;
    tabNodes: {
      [key in string]: { node: HTMLButtonElement | null; nextTab: string; prevTab: string };
    };
  }>(initializeTabRefs(tabs));

  const accessibilityProps = useMemo(() => {
    if ("ariaLabel" in remainingProps) {
      return { "aria-label": remainingProps.ariaLabel };
    }
    return { "aria-labelledby": remainingProps.ariaLabelledBy };
  }, [remainingProps]);

  const shiftFocusToTab = useCallback((tabValue: string) => {
    const tabRef = tabRefs.current.tabNodes[tabValue];
    if (tabRef) {
      tabRef.node?.focus();
    }
  }, []);

  const onTabKeyDown = useCallback(
    (tabValue: string, keyEvent: KeyboardEvent<HTMLButtonElement>) => {
      const tabRef = tabRefs.current.tabNodes[tabValue];
      if (tabRef) {
        switch (keyEvent.key) {
          case "Enter":
          case " ":
            shiftFocusToTabPanel(tabValue);
            setSelectedTab(tabValue);
            break;
          case "ArrowRight":
            shiftFocusToTab(tabRef.nextTab);
            break;
          case "ArrowLeft":
            shiftFocusToTab(tabRef.prevTab);
            break;
          case "End":
            shiftFocusToTab(tabRefs.current.lastTabValue);
            break;
          case "Home":
            shiftFocusToTab(tabRefs.current.firstTabValue);
            break;
          case "Tab":
            if (!keyEvent.shiftKey) {
              keyEvent.preventDefault();
              shiftFocusToTabPanel(selectedTab);
            }
            break;
          default:
            break;
        }
      }
    },
    [selectedTab],
  );

  return (
    <TabBarBase role="tablist" {...accessibilityProps} data-testid={dataTestId}>
      {tabs.map((tabData) => {
        const { title: tabTitle, value: tabValue, disabled: tabDisabled } = tabData;
        return tabTitle && tabValue ? (
          <Tab
            key={createTabItemTestId(dataTestId, tabValue)}
            {...tabData}
            onClick={() => setSelectedTab(tabValue)}
            onKeyDown={(keyEvent) => onTabKeyDown(tabValue, keyEvent)}
            variant={variant ?? TAB_VARIANTS.DEFAULT}
            selected={tabValue === selectedTab}
            ref={(thisRef) => {
              if (thisRef && !tabDisabled) {
                tabRefs.current.tabNodes[tabValue].node = thisRef;
              }
            }}
            tabsInstanceId={tabsInstanceId}
            dataTestId={dataTestId}
          />
        ) : null;
      })}
    </TabBarBase>
  );
}
