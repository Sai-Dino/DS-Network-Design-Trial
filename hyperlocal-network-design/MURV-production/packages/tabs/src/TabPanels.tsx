import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ITabContentProps, ITabPanelsImperativeHandles } from "./types";
import { TabPanelWrapper } from "./styles";
import { createTabId, createTabPanelId, createTabPanelTestId } from "./utils";
import { TABPANEL_VISIBILITY_TYPES } from "./constants";

export const TabPanels = forwardRef<ITabPanelsImperativeHandles, ITabContentProps>((props, ref) => {
  const {
    panels,
    selectedTab,
    panelsVisibilityType = TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_UNMOUNT_INACTIVE,
    tabsInstanceId,
    dataTestId = tabsInstanceId,
  } = props;

  const panelRefs = useRef<{
    [key in string]: HTMLDivElement;
  }>({});

  const panelsRenderStateRef = useRef<{ [key in string]: boolean }>(
    panels
      .map(({ value }) => [value, value === selectedTab] as const)
      .reduce((prev, curr) => ({ ...prev, [curr[0]]: curr[1] }), {}),
  );

  useImperativeHandle(
    ref,
    () => ({
      shiftFocusToPanel: (panelId) => {
        panelRefs.current[panelId]?.focus();
      },
    }),
    [],
  );

  useEffect(() => {
    panelsRenderStateRef.current[selectedTab] = true;
  }, [selectedTab]);

  const shouldPanelMount = (panelId: string) => {
    if (panelsVisibilityType === TABPANEL_VISIBILITY_TYPES.EAGER_RENDER_HIDE_INACTIVE) {
      return true;
    }
    if (panelsVisibilityType === TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_HIDE_INACTIVE) {
      return panelsRenderStateRef.current?.[panelId] || panelId === selectedTab;
    }
    return panelId === selectedTab;
  };

  return (
    <>
      {panels.map(({ value: tabValue, content }) => (
        <div
          id={createTabPanelId(tabsInstanceId, tabValue)}
          role="tabpanel"
          key={tabValue}
          aria-labelledby={createTabId(tabsInstanceId, tabValue)}
          aria-hidden={tabValue !== selectedTab}
          ref={(thisRef) => {
            if (thisRef) {
              panelRefs.current[tabValue] = thisRef;
            }
          }}
          tabIndex={-1}
          data-testid={createTabPanelTestId(dataTestId, tabValue)}
        >
          <TabPanelWrapper selected={tabValue === selectedTab} hidden={tabValue !== selectedTab}>
            {shouldPanelMount(tabValue) ? content : null}
          </TabPanelWrapper>
        </div>
      ))}
    </>
  );
});
