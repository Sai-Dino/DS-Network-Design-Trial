export const generateTabsInstanceId = () => (Math.random() + 1).toString(36).substring(7);

export const createTabId = (tabsInstanceId: string, tabValue: string) =>
  `tabs-${tabsInstanceId}-tabitem-${tabValue}`;

export const createTabPanelId = (tabsInstanceId: string, tabValue: string) =>
  `tabs-${tabsInstanceId}-tabpanel-${tabValue}`;

export const createTabItemTestId = (tabsDataTestId: string, tabValue: string) =>
  `${tabsDataTestId}-tabitem-${tabValue}`;

export const createTabPrefixIconTestId = (tabsDataTestId: string, tabValue: string) =>
  `${createTabItemTestId(tabsDataTestId, tabValue)}-prefixicon`;

export const createTabSuffixIconTestId = (tabsDataTestId: string, tabValue: string) =>
  `${createTabItemTestId(tabsDataTestId, tabValue)}-suffixicon`;

export const createTabTagTestId = (tabsDataTestId: string, tabValue: string) =>
  `${createTabItemTestId(tabsDataTestId, tabValue)}-tag`;

export const createTabPanelTestId = (tabsDataTestId: string, tabValue: string) =>
  `${tabsDataTestId}-tabpanel-${tabValue}`;
