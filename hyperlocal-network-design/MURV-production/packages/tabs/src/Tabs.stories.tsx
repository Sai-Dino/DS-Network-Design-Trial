import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckCircle, Close } from "@murv/icons";
import { useTabs } from "./Tabs";
import type {
  ITabBarAccessibilityProps,
  ITabVariantsProp,
  ITabsHookArgs,
  ITabContentPanel,
  IDataTestIdProp,
} from "./types";
import { TABPANEL_VISIBILITY_TYPES, TAB_VARIANTS } from "./constants";

const meta = {
  title: "Components/Tabs",
  tags: ["autodocs"],
  argTypes: {
    tabs: {
      description:
        "The list of tabs to render. Each item in this array should be of the type `ITab`.",
      type: {
        name: "array",
        value: {
          name: "object",
          value: {
            title: {
              name: "string",
              required: true,
            },
            value: {
              name: "string",
              required: true,
            },
            content: {
              name: "other",
              value: "JSX.Element | string",
              required: true,
            },
            prefixIcon: {
              name: "other",
              value: "JSX.Element",
              required: false,
            },
            tag: {
              name: "object",
              value: {
                tagText: {
                  name: "string",
                  required: true,
                },
                tagStyle: {
                  name: "string",
                  required: false,
                },
              },
              required: false,
            },
            suffixIcon: {
              name: "other",
              value: "JSX.Element",
              required: false,
            },
            onSuffixIconClick: {
              name: "function",
              required: false,
            },
            disabled: {
              name: "boolean",
              required: false,
            },
          },
        },
        required: true,
      },
    },
    initSelectedTab: {
      description: "The initial tab to be selected",
      type: {
        name: "string",
        required: false,
      },
      defaultValue: {
        summary: "The first tab in the list is selected by default",
      },
    },
    variant: {
      description: "The type of tab experience to be rendered.",
      type: {
        name: "enum",
        value: Object.values(TAB_VARIANTS),
      },
      control: { type: "select" },
      defaultValue: {
        summary: TAB_VARIANTS.DEFAULT,
      },
    },
    ariaLabel: {
      description:
        "The label describing this tab bar instance. Though this prop is not marked as required, either this or the `ariaLabelledBy` prop must be provided for accessibility reasons.",
      type: {
        name: "string",
        required: false,
      },
    },
    ariaLabelledBy: {
      description:
        "The DOM id of the label / text element describing this tab bar instance. Though this prop is not marked as required, either this or the `ariaLabel` prop must be provided for accessibility reasons.",
      type: {
        name: "string",
        required: false,
      },
    },
    panelsVisibilityType: {
      description:
        `The behaviour of tab panel contents with respect to their activation state. The options are: ` +
        `\`${TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_UNMOUNT_INACTIVE}\`: The contents are mounted & unmounted each time the tab activates & deactivates. This is the default behaviour` +
        `\`${TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_HIDE_INACTIVE}\`: The contents of a panel are not mounted untill the first time the tab is selected. Post that the content is never un mounted, only hidden from view.` +
        `\`${TABPANEL_VISIBILITY_TYPES.EAGER_RENDER_HIDE_INACTIVE}\`: The contents of all the panels are always present in the DOM and are only hidden from view.`,
      type: {
        name: "enum",
        value: Object.values(TABPANEL_VISIBILITY_TYPES),
      },
      control: { type: "select" },
      defaultValue: {
        summary: TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_UNMOUNT_INACTIVE,
      },
    },
  },
  render: (args) => {
    const [{ TabBar, TabContentPanel }, tabControls] = useTabs(args);

    return (
      <div data-testid="tabs-storybook-ui-container">
        <TabBar {...args} {...tabControls} />
        <TabContentPanel {...args} {...tabControls} />
      </div>
    );
  },
} satisfies Meta<
  React.FC<
    ITabsHookArgs &
      ITabVariantsProp &
      ITabBarAccessibilityProps &
      Pick<ITabContentPanel, "panelsVisibilityType"> &
      IDataTestIdProp
  >
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultStyleTabs: Story = {
  args: {
    tabs: [
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
          onClick: () => {},
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
    ],
    initSelectedTab: "tab_two",
    variant: "default",
    ariaLabel: "Default type tabs example",
    dataTestId: "example_one",
  },
};

export const DynamicStyleTabs: Story = {
  args: {
    tabs: DefaultStyleTabs.args.tabs,
    variant: TAB_VARIANTS.DYNAMIC,
    ariaLabel: "Dynamic style tabs example",
    dataTestId: "example_two",
  },
};

export const TabsWithEagerRenderedAndHiddenWhenInactiveTabPanels: Story = {
  args: {
    tabs: DefaultStyleTabs.args.tabs,
    ariaLabel: "Tabs with eager rendered and hidden when inactive type tab panels example",
    panelsVisibilityType: TABPANEL_VISIBILITY_TYPES.EAGER_RENDER_HIDE_INACTIVE,
    dataTestId: "example_three",
  },
};

export const TabsWithLazyRenderedAndHiddenWhenInactiveTabPanels: Story = {
  args: {
    tabs: DefaultStyleTabs.args.tabs,
    ariaLabel:
      "Tabs with lazy rendered but inly hidden & not unmounted on deactivation type tab panels example",
    panelsVisibilityType: TABPANEL_VISIBILITY_TYPES.LAZY_RENDER_HIDE_INACTIVE,
    dataTestId: "example_four",
  },
};
