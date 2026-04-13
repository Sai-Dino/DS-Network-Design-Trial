import React, { useState } from "react";
import { StoryObj, Meta } from "@storybook/react";
import { AddTask } from "@murv/icons";
import { Drawer, TFooterProps, THeaderProps } from "./index";

type DrawerArgTypes = {
  drawerContainerWidth: number;
  headerProps: THeaderProps;
  footerProps?: TFooterProps | null;
  dataTestId: string;
  shouldCloseOnOverlayClick?: boolean;
};

const meta = {
  title: "Components/Drawer",
  tags: ["autodocs"],
  decorators: [(Story) => <Story />],
  render: (args) => {
    const [show, setShow] = useState<boolean>(false);

    const hideDrawer = () => {
      setShow(false);
    };

    return (
      <div data-testid="drawer-storybook-conainer">
        <button
          type="button"
          id="drawer-modal-id"
          onClick={() => setShow(true)}
          data-testid={`${args.dataTestId}-show-modal-button`}
        >
          Show Drawer
        </button>

        <Drawer
          id="drawer-modal-id"
          show={show}
          drawerContainerWidth={args.drawerContainerWidth}
          closeDrawer={hideDrawer}
          dataTestId={args.dataTestId}
          shouldCloseOnOverlayClick={args.shouldCloseOnOverlayClick}
        >
          <Drawer.Header {...args.headerProps} />
          <Drawer.Content>
            <div>{`A "Drawer" is a common UI pattern in web and mobile applications where a portion of the screen slides in from the edge, often containing navigation options or additional content.`}</div>
          </Drawer.Content>
          <Drawer.Footer {...args.footerProps} />
        </Drawer>
      </div>
    );
  },
  argTypes: {
    drawerContainerWidth: {
      description: "width of the Drawer",
      defaultValue: 520,
    },
    headerProps: {
      description:
        "Header props should include primary and secondary titles, along with an optional icon. The primary title is mandatory and is displayed inside the drawer.",
    },
    footerProps: {
      description:
        "Footer props support ButtonGroups, and ButtonGroups props must be passed accordingly",
    },
    shouldCloseOnOverlayClick: {
      description: "When true, clicking outside the drawer content will close the drawer",
      defaultValue: true,
    },
  },
} satisfies Meta<React.ComponentType<DrawerArgTypes>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultDrawer: Story = {
  args: {
    drawerContainerWidth: 520,
    headerProps: {
      icon: <AddTask className="drawer-icon" />,
      title: "Drawer title",
      subTitle: "Drawer sub title",
    },
    footerProps: {
      buttonGroupProps: {
        buttons: [
          { buttonType: "tertiary", children: "Tertiary", onClick: () => {} },
          { buttonType: "secondary", children: "Secondary", onClick: () => {} },
          { buttonType: "primary", children: "Primary", onClick: () => {} },
        ],
      },
    },
    dataTestId: "default-drawer-story-test-id",
    shouldCloseOnOverlayClick: false,
  },
};

export const DrawerWithMandateControls: Story = {
  args: {
    drawerContainerWidth: 250,
    headerProps: {
      title:
        "The primary title of the Drawer component is usually displayed at the top of the drawer.",
    },
    dataTestId: "drawer-without-bottom-actions-test-id",
    shouldCloseOnOverlayClick: false,
  },
};
