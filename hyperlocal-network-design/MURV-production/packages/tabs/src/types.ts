import { TagProps } from "@murv/tag";
import { TABPANEL_VISIBILITY_TYPES, TAB_VARIANTS } from "./constants";

/**
 * The types of tab elements available. These variants differ in terms of visual & behavioral aspects.
 */
type TabVariants = (typeof TAB_VARIANTS)[keyof typeof TAB_VARIANTS];

/**
 * The different modes of the tab panels' interactions with the DOM in response to activation & deactivation.
 */
type TabPanelsVisiblityTypes =
  (typeof TABPANEL_VISIBILITY_TYPES)[keyof typeof TABPANEL_VISIBILITY_TYPES];

export type ITabControls = {
  /**
   * The state element that keeps track of the current selected / active tab.
   */
  selectedTab: string;
  /**
   * The state setter function, allowing fine grainefd control over the tabs experience.
   * @param newSelectedTab: string
   * @returns true if the newSelectedTab argument is a valid tab. Returns false otherwise.
   */
  setSelectedTab: (newSelectedTab: string) => boolean;
};

export type ITabVariantsProp = {
  /**
   * The tab variant to render.
   */
  variant?: TabVariants;
};

export type IDataTestIdProp = {
  /**
   * The data-testid to be used for this instance of tabs components.
   */
  dataTestId?: string;
};

type IAriaLabelProp = {
  /**
   * The label to be associated with the given element in case a separate label element is not available.
   */
  ariaLabel: string;
};

/**
 * Accessibility markers for the TabBar component
 */
export type ITabBarAccessibilityProps =
  | {
      /**
       * The id of the element used to label this TabBar instance.
       */
      ariaLabelledBy: string;
    }
  | IAriaLabelProp;

type IBaseIconProps = {
  icon: JSX.Element;
} & IAriaLabelProp;

type IPressableIconProps = IBaseIconProps & {
  onClick: Function;
};

type ITabContentProp = {
  /**
   * The content coresponding a tab that has to be rendered when the said tab is activated.
   */
  content: JSX.Element | string;
};

type ITabsInstanceIdProp = {
  /**
   * Internal prop used to maintain unique DOM ids for different instances of the tabs components.
   */
  tabsInstanceId: string;
};

export type ITab = ITabContentProp & {
  /**
   * The title of the tab to be shown in the tab bar.
   */
  title: string;
  /**
   * The value / identifier that uniquely represents this tab among the list of tabs in this instance.
   * Used to determine & maintain the activation state of the tabs.
   */
  value: string;
  /**
   * The icon to be displayed before the tab title.
   */
  prefixIcon?: IBaseIconProps;
  /**
   * The tag/label to be displayed just after the tab title.
   */
  tag?: Pick<TagProps, "tagStyle" | "tagText">;
  /**
   * The icon to be displayed after the tab title & the tag. This icon is meant to be clickable.
   */
  suffixIcon?: IPressableIconProps;
  /**
   * The prop to disable or enable the tab.
   */
  disabled?: boolean;
};

type ITabCollectionProp = {
  /**
   * The list of tabs to be rendered.
   */
  tabs: ITab[];
};

/**
 * The exposed props for the TabBar component.
 */
export type ITabBar = ITabVariantsProp & ITabControls & ITabBarAccessibilityProps & IDataTestIdProp;

export type ITabListProps = ITabBar &
  ITabCollectionProp &
  ITabsInstanceIdProp & {
    shiftFocusToTabPanel: (tabPanelId: string) => void;
  };

export type ITabControlProps = ITab &
  ITabsInstanceIdProp &
  NonNullable<ITabVariantsProp> &
  IDataTestIdProp & {
    selected: boolean;
    onClick: NonNullable<React.DOMAttributes<HTMLButtonElement>["onClick"]>;
    onKeyDown: NonNullable<React.DOMAttributes<HTMLButtonElement>["onKeyDown"]>;
  };

/**
 * The type signature of the arguments of the useTabs hook.
 */
export type ITabsHookArgs = ITabCollectionProp & {
  initSelectedTab?: string;
};

/**
 * The exposed props for the TabContentPanel component.
 */
export type ITabContentPanel = Pick<ITabControls, "selectedTab"> &
  IDataTestIdProp & {
    panelsVisibilityType?: TabPanelsVisiblityTypes;
  };

export type ITabContentProps = ITabContentPanel &
  ITabsInstanceIdProp & {
    panels: Pick<ITab, "content" | "value">[];
  };

export interface ITabPanelsImperativeHandles {
  shiftFocusToPanel: (panelId: string) => void;
}

export type ITabElements = {
  TabBar: React.FC<ITabBar>;
  TabContentPanel: React.FC<ITabContentPanel>;
};
