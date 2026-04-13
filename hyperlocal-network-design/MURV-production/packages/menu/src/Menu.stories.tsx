import React from "react";
import type { StoryObj } from "@storybook/react";
import { Save } from "@murv/icons";
import { Menu } from "./components/Menu";

const menuItemsWithMixedIcons = [
  {
    label: "Option 1",
    onHover: () => {},
    hasActionables: false,
    menuItems: [
      {
        label: "Option 1-1",
        leftIcon: <Save />,
        onClick: () => console.log("Clicked"),
      },
      {
        label: "Option 1-2",
      },
    ],
  },
  {
    label: "Option 2",
    onHover: () => {},
    hasActionables: false,
    leftIcon: <Save />,
    menuItems: [
      {
        label: "Option 2-1",
        leftIcon: <Save />,
        onClick: () => console.log("Clicked"),
      },
      {
        label: "Option 2-2",
      },
    ],
  },
];

const demoMenuItems = [
  {
    label: "Option 1",
    leftIcon: <Save />,
    onHover: () => {},
    hasActionables: false,
    menuItems: [
      {
        label: "Option 4",
        leftIcon: <Save />,
        onClick: () => console.log("Clicked"),
        hasActionables: true,
        menuItems: [
          {
            label: "Option AB",
            leftIcon: <Save />,
            onClick: () => console.log("Clicked"),
          },
          {
            label: "Option CD",
            leftIcon: <Save />,
          },
        ],
      },
      {
        label: "Option 5",
        leftIcon: <Save />,
        disabled: true,
      },
      {
        label: "Option 6",
        leftIcon: <Save />,
      },
      {
        label: "Option 7",
        leftIcon: <Save />,
      },
    ],
  },
  {
    label: "Option 8",
    leftIcon: <Save />,
    menuItems: [
      {
        label: "Option 9",
        leftIcon: <Save />,
      },
      {
        label: "Option 10",
        leftIcon: <Save />,
      },
      {
        label: "Option 11",
        leftIcon: <Save />,
      },
      {
        label: "Option 12",
        leftIcon: <Save />,
      },
    ],
  },
  {
    label: "Option 3",
    leftIcon: <Save />,
  },
];

const meta = {
  title: "Components/Menu",
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof meta>;

const DefaultMenu: Story = {
  render: (args) => {
    const {
      title,
      targetText,
      menuItems,
      scrollThreshold,
      popoverAction,
      popoverPosition,
      closeOnClickOutside,
      open,
      groupMenuType,
    } = args;

    const [openMenu, setOpenMenu] = React.useState<boolean>(open);

    const onVisibilityChange = (value: boolean) => {
      setOpenMenu(value);
    };

    return (
      <Menu
        title={title}
        open={openMenu}
        groupMenuType={groupMenuType}
        popoverPosition={popoverPosition}
        testId="story"
        onVisibilityChange={onVisibilityChange}
        popoverAction={popoverAction}
        closeOnClickOutside={closeOnClickOutside}
        scrollThreshold={scrollThreshold}
        renderTarget={(props) => (
          <button {...props} type="button">
            {targetText}
          </button>
        )}
        menuItems={menuItems}
      />
    );
  },
};

export const DefaultMenuStory: Story = {
  ...DefaultMenu,
  name: "Default Menu Story",
  args: {
    targetText: "Open Menu",
    popoverPosition: "bottom-start",
    title: "Default Menu",
    scrollThreshold: 6,
    closeOnClickOutside: true,
    popoverAction: "click",
    menuItems: demoMenuItems,
    open: false,
    onVisibilityChange: () => {},
  },
  argTypes: {
    popoverPosition: {
      options: [
        "right-center",
        "right-top",
        "right-bottom",
        "right-start",
        "right-end",
        "left-center",
        "left-top",
        "left-bottom",
        "left-start",
        "left-end",
        "top-center",
        "top-right",
        "top-left",
        "top-start",
        "top-end",
        "bottom-center",
        "bottom-right",
        "bottom-left",
        "bottom-start",
        "bottom-end",
      ],
      control: {
        type: "radio",
      },
    },
    closeOnClickOutside: { control: { type: "boolean" } },
    popoverAction: {
      options: ["click", "hover"],
      control: {
        type: "radio",
      },
    },
  },
};

export const ReplaceMenuStory: Story = {
  ...DefaultMenu,
  name: "Replace Menu",
  args: {
    targetText: "Open Menu",
    title: "Main Title",
    scrollThreshold: 10,
    closeOnClickOutside: true,
    popoverAction: "click",
    popoverPosition: "bottom-start",
    menuItems: demoMenuItems,
  },
};

export const ActionableItemsMenuStory: Story = {
  ...DefaultMenu,
  name: "With Actionable Btns Menu",
  args: {
    targetText: "Open Menu",
    title: "Main Title",
    scrollThreshold: 10,
    closeOnClickOutside: true,
    popoverAction: "click",
    popoverPosition: "bottom-start",
    menuItems: demoMenuItems,
  },
};

export const WithoutMainTitleStory: Story = {
  ...DefaultMenu,
  name: "Without Main Title",
  args: {
    targetText: "Open Menu",
    scrollThreshold: 10,
    closeOnClickOutside: true,
    popoverAction: "click",
    popoverPosition: "bottom-start",
    menuItems: demoMenuItems,
  },
};

export const WithAndWithoutMainIconsStory: Story = {
  ...DefaultMenu,
  name: "Mixed Icons",
  args: {
    targetText: "Open Menu",
    scrollThreshold: 10,
    closeOnClickOutside: true,
    popoverAction: "click",
    popoverPosition: "bottom-start",
    menuItems: menuItemsWithMixedIcons,
  },
};

export const WithSubmenuGroupByHeader: Story = {
  ...DefaultMenu,
  name: "Group Submenu By Header",
  args: {
    groupMenuType: "header",
    targetText: "Open Menu",
    scrollThreshold: 10,
    closeOnClickOutside: true,
    popoverAction: "click",
    popoverPosition: "bottom-start",
    menuItems: menuItemsWithMixedIcons,
  },
};
