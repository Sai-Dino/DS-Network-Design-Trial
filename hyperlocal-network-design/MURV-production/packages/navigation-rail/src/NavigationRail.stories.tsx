import React from "react";
import { Home, ShoppingCart, Inventory, Money, Calculate, BarChart } from "@murv/icons";
import { Badge } from "@murv/badge";
import type { Meta, StoryObj } from "@storybook/react";
import NavigationRailItem from "./components/NavigationRailItem";
import NavigationRail from "./NavigationRail";
import { INavigationRail } from "./types";
import { ORIENTATION } from "./constants";

const meta = {
  title: "Components/NavigationRail",
  component: NavigationRail,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      options: [ORIENTATION.VERTICAL, ORIENTATION.HORIZONTAL],
      control: {
        type: "radio",
      },
      description: "Orientation of the navigation rail",
    },
    maxTopNavItemCount: {
      control: { type: "number" },
      description:
        "Maximum number of navigation items to be displayed. This is just a suggestion. Final number will be minimum of what we can place in the corresponding dimension and this value",
    },
    selectedNavItem: {
      control: { type: "number" },
      description:
        "Index of the selected navigation item. This is the responsibility of client to let the Navigation Rail know the selected index. Each NavigationRailItem provides an onClick callback. Client should utilise this.",
    },
    hideCloseIcon: { control: { type: "boolean" }, description: "Hide close icon in the sub menu" },
  },
  decorators: [(Story) => <Story />],
} satisfies Meta<INavigationRail>;

// export default meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const NavigationRailItemDefault: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-default-selection",
    selectedNavItem: 1,
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" size="16px" />}
      />,
      <NavigationRailItem
        label="Manage Sellers"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart size="16px" />}
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        disabled
        icon={<Inventory size="16px" />}
      />,
      <NavigationRailItem
        label="Payments"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Money size="16px" />}
        subMenuItems={[
          {
            label: "Option 1",
            icon: <Money size="25px" />,
            url: "#path=/docs/components-accordion--docs",
            onClick: () => {
              console.log("Clicked OPtion 1");
            },
          },
        ]}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailItemWithBadgeOnIcon: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-icon-badge-selection",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" />}
        badge={<Badge>10</Badge>}
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        badge={<Badge>10</Badge>}
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Inventory />}
        badge={<Badge>10</Badge>}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailItemWithBadgeOnLabel: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-label-badge-selection",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        badge={<Badge>10</Badge>}
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        badge={<Badge>10</Badge>}
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        badge={<Badge>10</Badge>}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailItemWithDisableItems: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-disable-item-selection",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" />}
        disabled
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        disabled
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Inventory />}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailItemWithMore: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-more-item-selection",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" />}
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        disabled
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Inventory />}
      />,
      <NavigationRailItem
        label="Payments"
        badge={<Badge>10</Badge>}
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Money />}
        subMenuItems={[
          {
            label: "Option 1",
            icon: <Money />,
            url: "#path=/docs/components-accordion--docs",
            onClick: () => {
              console.log("Clicked OPtion 1");
            },
            subMenuItems: [
              {
                label: "Option 1.1",
                url: "#path=/docs/components-avatar--docs",
                onClick: () => {
                  console.log("Clicked OPtion 1.1");
                },
              },
            ],
          },
          {
            label: "Option 2",
            url: "#path=/docs/components-badge--docs",
            onClick: () => {
              console.log("Clicked OPtion 2");
            },
          },
          {
            label: "Option 3",
            url: "#path=/docs/components-banner--docs",
            onClick: () => {
              console.log("Clicked OPtion 3");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
                icon: <Money />,
              },
              {
                label: "Option 3.2",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.2");
                },
                icon: <Money />,
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Advertising"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Calculate />}
      />,
      <NavigationRailItem
        label="Growth"
        onClick={() => {
          console.log("Growth");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs"
        subMenuItems={[
          {
            label: "Option 1.1",
            url: "#path=/docs/components-avatar--docs",
            onClick: () => {
              console.log("Clicked OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Report"
        onClick={() => {
          console.log("Report");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs"
        subMenuItems={[
          {
            label: "Option 1.1",
            url: "#path=/docs/components-avatar--docs",
            onClick: () => {
              console.log("Clicked OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailHorizontal: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-horizontal",
    orientation: "horizontal",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" />}
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        disabled
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Inventory />}
      />,
      <NavigationRailItem
        label="Payments"
        badge={<Badge>10</Badge>}
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Money />}
        subMenuItems={[
          {
            label: "Option 1",
            icon: <Money />,
            url: "#path=/docs/components-accordion--docs",
            onClick: () => {
              console.log("Clicked OPtion 1");
            },
            subMenuItems: [
              {
                label: "Option 1.1",
                url: "#path=/docs/components-avatar--docs",
                onClick: () => {
                  console.log("Clicked OPtion 1.1");
                },
              },
            ],
          },
          {
            label: "Option 2",
            url: "#path=/docs/components-badge--docs",
            onClick: () => {
              console.log("Clicked OPtion 2");
            },
          },
          {
            label: "Option 3",
            url: "#path=/docs/components-banner--docs",
            onClick: () => {
              console.log("Clicked OPtion 3");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Advertising"
        onClick={() => {
          console.log("Hello");
        }}
        dataTestId="nav"
        icon={<Calculate />}
      />,
      <NavigationRailItem
        label="Growth"
        onClick={() => {
          console.log("Growth");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs"
        subMenuItems={[
          {
            label: "Option 1.1",
            url: "#path=/docs/components-avatar--docs",
            onClick: () => {
              console.log("Clicked OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "#path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Report"
        onClick={() => {
          console.log("Report");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs"
        subMenuItems={[
          {
            label: "Option 1.1",
            url: "#path=/docs/components-avatar--docs",
            onClick: () => {
              console.log("Clicked OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "#path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailItemWithGroupByHeader: Story = {
  args: {
    dataTestId: "navigation-rail-test-id-with-group-by-header",
    topNavigation: [
      <NavigationRailItem
        label="Home"
        url="#path=/docs/components-accordion--docs"
        onClick={() => {
          console.log("Home");
        }}
        dataTestId="nav"
        icon={<Home className="home-icon" />}
      />,
      <NavigationRailItem
        label="Orders"
        onClick={() => {
          console.log("Orders");
        }}
        dataTestId="nav"
        icon={<ShoppingCart />}
        disabled
      />,
      <NavigationRailItem
        label="Listings"
        onClick={() => {
          console.log("Listings");
        }}
        dataTestId="nav"
        icon={<Inventory />}
      />,
      <NavigationRailItem
        label="Payments"
        badge={<Badge>10</Badge>}
        onClick={() => {
          console.log("Payments");
        }}
        groupMenuType="header"
        dataTestId="nav"
        icon={<Money />}
        subMenuItems={[
          {
            label: "Option 1",
            icon: <Money />,
            url: "#path=/docs/components-accordion--docs",
            onClick: () => {
              console.log("Clicked Payments OPtion 1");
            },
            subMenuItems: [
              {
                label: "Option 1.1",
                url: "#path=/docs/components-avatar--docs1.1",
                onClick: () => {
                  console.log("Clicked Payments OPtion 1.1");
                },
              },
              {
                label: "Option 1.2",
                url: "#path=/docs/components-avatar--docs1.2",
                onClick: () => {
                  console.log("Clicked Payments OPtion 1.2");
                },
              },
            ],
          },
          {
            label: "Option 2",
            url: "#path=/docs/components-badge--docs",
            onClick: () => {
              console.log("Clicked Payments OPtion 2");
            },
          },
          {
            label: "Option 3",
            url: "#path=/docs/components-banner--docs",
            onClick: () => {
              console.log("Clicked Payments OPtion 3");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked Payments OPtion 3.1");
                },
                icon: <Money />,
              },
              {
                label: "Option 3.2",
                url: "path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked Payments OPtion 3.2");
                },
                icon: <Money />,
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Advertising"
        onClick={() => {
          console.log("Advertising");
        }}
        dataTestId="nav"
        icon={<Calculate />}
      />,
      <NavigationRailItem
        label="Growth"
        onClick={() => {
          console.log("Growth");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs"
        subMenuItems={[
          {
            label: "Option 1",
            url: "#path=/docs/components-avatar--docs",
            onClick: () => {
              console.log("Clicked Growth OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 1.1",
                url: "#path=/docs/components-navigationrail--docs",
                onClick: () => {
                  console.log("Clicked Growth OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Report"
        onClick={() => {
          console.log("Report");
        }}
        dataTestId="nav"
        icon={<BarChart />}
        url="#path=/docs/components-badge--docs-report"
        subMenuItems={[
          {
            label: "Option 1.1",
            url: "#path=/docs/components-avatar--docs-report1.1",
            onClick: () => {
              console.log("Clickedx OPtion 1.1");
            },
            subMenuItems: [
              {
                label: "Option 3.1",
                url: "#path=/docs/components-navigationrail--docs3-report3.1",
                onClick: () => {
                  console.log("Clicked Report OPtion 3.1");
                },
              },
            ],
          },
        ]}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {},
};

export const NavigationRailWithHoverableSubItems: Story = {
  args: {
    dataTestId: "navigation-rail-with-hoverable-subitems",
    topNavigation: [
      <NavigationRailItem
        label="Workspace"
        icon={<Home />}
        onClick={() => console.log("Top level clicked: Workspace")}
        subMenuItems={[
          {
            label: "Overview",
            url: "https://www.example.com/overview",
            onClick: () => {
              console.log("Sub item clicked: Overview");
            },
          },
          {
            label: "Reports",
            url: "https://www.example.com/reports",
            onClick: () => {
              console.log("Sub item clicked: Reports");
            },
            subMenuItems: [
              {
                label: "Daily",
                url: "https://www.example.com/reports/daily",
                onClick: () => {
                  console.log("Sub item clicked: Reports > Daily");
                },
              },
              {
                label: "Monthly",
                url: "https://www.example.com/reports/monthly",
                onClick: () => {
                  console.log("Sub item clicked: Reports > Monthly");
                },
              },
            ],
          },
        ]}
      />,
      <NavigationRailItem
        label="Orders"
        icon={<ShoppingCart />}
        onClick={() => console.log("Top level clicked: Orders")}
        subMenuItems={[
          {
            label: "Open Orders",
            url: "https://www.example.com/orders/open",
            onClick: () => {
              console.log("Sub item clicked: Open Orders");
            },
          },
          {
            label: "Completed Orders",
            url: "https://www.example.com/orders/completed",
            onClick: () => {
              console.log("Sub item clicked: Completed Orders");
            },
          },
        ]}
      />,
      <NavigationRailItem
        label="Insights"
        icon={<BarChart />}
        onClick={() => console.log("Top level clicked: Insights")}
        subMenuItems={[
          {
            label: "Traffic",
            url: "https://www.example.com/insights/traffic",
            onClick: () => {
              console.log("Sub item clicked: Traffic");
            },
          },
          {
            label: "Conversions",
            url: "https://www.example.com/insights/conversions",
            onClick: () => {
              console.log("Sub item clicked: Conversions");
            },
          },
        ]}
      />,
    ],
    maxTopNavItemCount: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Hover on a rail item to reveal subitems. Clicking a subitem logs to the console. Because each subitem has a url, browser context menus include Open link in new tab on right-click.",
      },
    },
  },
};
