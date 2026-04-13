# Tabs Components
This package contains the code for creating tab experiences as part of the MURV library. This document has the following sections,
* [Usage](#usage)
* [Props & Arguments](#props--arguments)
  * [useTabs Arguments](#usetabs-arguments)
  * [TabBar Props](#tabbar-props)
  * [TabContentPanel Props](#tabcontentpanel-props)
* [Links](#links)

## Usage
The primary export of this package is a hook, `useTabs`. This hook returns the corresponding UI elements when initialized which can be rendered in your page. Shown below is a code sample of the same.
```tsx
import React from "react";
import { useTabs } from "@murv/tabs";

const tabs = [
  {
    title: "Tab 1",
    value: "tab_one",
    content: <div>Tab 1 Content</div>,
  },
  {
    title: "Tab 2",
    value: "tab_two",
    content: <div>Tab 2 Content</div>,
  },
  {
    title: "Tab 3",
    value: "tab_three",
    content: <div>Tab 3 Content</div>,
  }
];

const SampleExample: React.FC = () => {
  const [Tabs, tabsControls] = useTabs(tabs);
  
  return(
    <div>
      <Tabs.TabBar {...tabsControls}/>
      <Tabs.TabContentPanel {...tabsControls}/>
    </div>
  )
}
```

The above example is a rather simple one. Each of the units involved can be further customised by passing additional props/arguments. Please refer to the props & arguments section below for more information & Visit the storybook for visual examples of the same.

## Props & Arguments
### useTabs Arguments
The type signature of the arguments accepted by the `useTabs` hook is mentioned below.
```typescript
type ITabsHookArgs = {
  /**
   * The tabs to be rendered in the tab bar. The definition of `ITab` is mentioned below.
   */
  tabs: ITab[];
  /**
   * The tab to selected upon the initial render.
   */
  initSelectedTab?: string;
};

type ITab = {
  /**
   * The title of the tab to be shown in the tab bar.
   */
  title: string;
  /**
   * The value / identifier that uniquely represents this tab among the list of tabs in this instance.
   */
  value: string;
  /**
   * The content coresponding a tab that has to be rendered when the said tab is activated.
   */
  content: JSX.Element | string;
  /**
   * The icon to display before the tab title.
   */
  prefixIcon?: IBaseIconProps;
  /**
   * The tag / label to display after the tab title.
   */
  tag?: string;
  /**
   * The icon to display after the tab title. This will be enclosed within a button element and is actionable.
   */
  suffixIcon?: IPressableIconProps;
  /**
   * The prop to disable or enable the tab. The value is set to false by default i.e, the tabs are enabled by default.
   */
  disabled?: boolean;
};
```

### TabBar Props
The type signature of the `TabBar` component returned by the `useTabs` hook is mentioned below.
```typescript
type ITabBar = ITabBarElementProps & ITabsControls & ITabBarAccessibilityProps;

type ITabBarElementProps = {
  /**
   * The design variant of the tabs experience to be rendered. Refer to the storybook for the two designs. By default, the `default` design is rendered.
   */
  variant?: "default" | "dynamic";
  /**
   * The data-testid for testing.
   */
  dataTestId?: string;
}

type ITabControls = {
  /**
   * The state variable that keeps track of the current selected / active tab.
   */
  selectedTab: string;
  /**
   * The state setter function, allowing fine grainefd control over the tabs experience.
   * @param newSelectedTab: string
   * @returns true if the newSelectedTab argument is a valid tab & the state change is valid. Returns false otherwise.
   */
  setSelectedTab: (newSelectedTab: string) => boolean;
};


type ITabBarAccessibilityProps =
  | {
      /**
       * The id of the element used to label this TabBar instance.
       */
      ariaLabelledBy: string;
    }
  | {
      /**
       * The label to be associated with the given element in case a separate label element is not available.
       */
      ariaLabel: string;
    };
```

### TabContentPanel Props
The type signature of the `TabContentPanel` component returned by the `useTabs` hook is mentioned below.
```typescript
type ITabContentPanel = {
  /**
   * The state variable that keeps track of the current selected / active tab.
   */
  selectedTab: string;
  /**
   * The different modes of the tab panels' interactions with the DOM in response to activation & deactivation.
   */
  panelsVisibilityType?: TabPanelsVisiblityTypes;
  /**
   * The data-testid for testing.
   */
  dataTestId?: string;
}

/**
 * The behaviour of tab panel contents with respect to their activation state. The options are:
 * eager-render-and-hide-inactive: The contents are mounted & unmounted each time the tab activates & deactivates. This is the default behaviour
 * lazy-render-and-hide-inactive: The contents of a panel are not mounted untill the first time the tab is selected. Post that the content is never un mounted, only hidden from view.
 * lazy-render-and-unmount-inactive: The contents of all the panels are always present in the DOM and are only hidden from view.
 */
type TabPanelsVisiblityTypes = "eager-render-and-hide-inactive" | "lazy-render-and-hide-inactive" | "lazy-render-and-unmount-inactive"
```

## Links
* [The Tabs component figma](https://www.figma.com/file/o2VrJT48UsU1nlbjFkkNp2/Master-Components?node-id=403%3A7024&mode=dev)
* [The Tab Bar component figma](https://www.figma.com/file/o2VrJT48UsU1nlbjFkkNp2/Master-Components?node-id=525%3A1910&mode=dev)
* [The Tabs component solutioning document](https://docs.google.com/document/d/1THfivg2M-XWMIRc5yJbl4yS9XWdBl1HYAahsOL0XkuY/edit)
* [The Tab Bar component solutioning document](https://docs.google.com/document/d/1XJQWhM9JGwO6bnk0y0gLQQzNFHB25gwUtBEG7IRMtZg/edit)
* [The Tabs & Tab Bar components solutioning review points & MoMs](https://docs.google.com/document/d/1DqPOXrGgvcGYKA6UeEMhUqsnelmFPogcR-HLZUfPHts/edit#heading=h.nkr6csdth92i)
* [WAI ARIA specification for the Tabs pattern implementation](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
