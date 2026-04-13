import React, { useCallback, useRef, useState } from "react";
import { useId } from "@murv/core/hooks/use-id";
import {
  ITabBar,
  ITabContentPanel,
  ITabPanelsImperativeHandles,
  ITabsHookArgs,
  ITabElements,
  ITabControls,
} from "./types";
import { TabList } from "./TabList";
import { TabPanels } from "./TabPanels";

export const useTabs = (args: ITabsHookArgs): [ITabElements, ITabControls] => {
  const { tabs = [], initSelectedTab } = args;
  const [selectedTab, rawSetSelectedTab] = useState<string>(
    initSelectedTab ?? tabs[0]?.value ?? "",
  );
  const tabPanelsRef = useRef<ITabPanelsImperativeHandles>(null);
  const tabsInstanceId = useId();

  const shiftFocusToTabPanel = useCallback(
    (panelId: string) => tabPanelsRef.current?.shiftFocusToPanel(panelId),
    [],
  );

  const TabBar: React.FC<ITabBar> = useCallback(
    (tabBarProps) => (
      <TabList
        {...tabBarProps}
        tabs={tabs}
        shiftFocusToTabPanel={shiftFocusToTabPanel}
        tabsInstanceId={tabsInstanceId}
      />
    ),
    [tabs],
  );

  const TabContentPanel: React.FC<ITabContentPanel> = useCallback(
    (contentPanelProps) => (
      <TabPanels
        {...contentPanelProps}
        panels={tabs}
        ref={tabPanelsRef}
        tabsInstanceId={tabsInstanceId}
      />
    ),
    [tabs],
  );

  const setSelectedTab = useCallback(
    (newSelectedTab: string) => {
      if (tabs.find(({ value }) => value === newSelectedTab)) {
        rawSetSelectedTab(newSelectedTab);
        return true;
      }
      return false;
    },
    [tabs],
  );

  return [
    { TabBar, TabContentPanel },
    { selectedTab, setSelectedTab },
  ] as const;
};
