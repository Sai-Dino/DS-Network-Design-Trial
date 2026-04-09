import React, { useState } from "react";
import "@testing-library/jest-dom";
import { render, fireEvent } from "murv/test-utils";
import { Drawer, TFooterProps, THeaderProps, TDataTestIdProps } from "../src";

type TDrawerProps = TDataTestIdProps & {
  headerProps: THeaderProps;
  contentString: string;
  footerProps?: TFooterProps | null;
};

const mockCallback = jest.fn();

const defaultProps: TDrawerProps = {
  headerProps: {
    icon: "HeaderTitle",
    title: "Primary title",
    subTitle: " secondaryTitle",
  },
  contentString:
    "In React, a Drawer component is typically used to create a side menu or panel that slides in from the edge of the screen. \n It's a common UI pattern used in mobile and web applications to provide navigation options, settings, or additional content without taking up too much space on the screen.",
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
};

const drawerWithOnlyMandatoryElements: TDrawerProps = {
  headerProps: {
    title:
      "The primary title of the Drawer component is usually displayed at the top of the drawer.",
  },
  contentString:
    "Drawer Backdrop is a semi-transparent overlay that covers the entire screen when the drawer is open. It prevents interaction with the content behind the drawer and typically closes the drawer when clicked or tapped. Drawer Content is the actual content of the drawer. It usually contains navigation links, settings options, or any other relevant information.",
  dataTestId: "drawer-without-bottom-actions-test-id",
};

const WrappedDefaultDrawerComponent = () => {
  const [show, setShow] = useState<boolean>(false);

  const hideDrawer = () => {
    setShow(false);
    mockCallback();
  };

  return (
    <>
      <button
        type="button"
        id="drawer-modal-id"
        onClick={() => setShow(true)}
        data-testid={`${defaultProps.dataTestId}-show-modal-button`}
      >
        Show Drawer
      </button>

      <Drawer
        id="drawer-modal-id"
        show={show}
        drawerContainerWidth={520}
        closeDrawer={hideDrawer}
        dataTestId={defaultProps.dataTestId}
      >
        <Drawer.Header {...defaultProps.headerProps} />
        <Drawer.Content>
          <div>{drawerWithOnlyMandatoryElements.contentString}</div>
        </Drawer.Content>
        <Drawer.Footer {...defaultProps.footerProps} />
      </Drawer>
    </>
  );
};

const WrappedDrawerWithMandatoryElements = () => {
  const [show, setShow] = useState<boolean>(false);

  const hideDrawer = () => {
    setShow(false);
  };

  return (
    <>
      <button
        type="button"
        id="drawer-modal-id"
        onClick={() => setShow(true)}
        data-testid={`${drawerWithOnlyMandatoryElements.dataTestId}-show-modal-button`}
      >
        Show Drawer
      </button>
      <Drawer
        id="drawer-modal-id"
        show={show}
        drawerContainerWidth={520}
        closeDrawer={hideDrawer}
        dataTestId={drawerWithOnlyMandatoryElements.dataTestId}
      >
        <Drawer.Header {...drawerWithOnlyMandatoryElements.headerProps} />
        <Drawer.Content>
          <div>{drawerWithOnlyMandatoryElements.contentString}</div>
        </Drawer.Content>
        <Drawer.Footer {...drawerWithOnlyMandatoryElements.footerProps} />
      </Drawer>
    </>
  );
};

describe("Drawer", () => {
  beforeAll(() => {
    HTMLDialogElement.prototype.show = jest.fn();
    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();
  });

  it("renders default drawer", async () => {
    const { getByText, findByTestId } = await render(<WrappedDefaultDrawerComponent />);
    const showDrawer = await getByText("Show Drawer");
    fireEvent.click(showDrawer);
    const drawerComponent = await findByTestId(defaultProps.dataTestId);
    expect(drawerComponent).toBeInTheDocument();
    const closeIcon = await findByTestId(`${defaultProps.dataTestId}-button`);
    fireEvent.click(closeIcon);
    expect(drawerComponent.hidden).toBe(false);
  });

  it("renders drawer with mandatory elements", async () => {
    const closeSpy = jest.spyOn(HTMLDialogElement.prototype, "close");

    const { getByText, findByTestId } = await render(<WrappedDrawerWithMandatoryElements />);
    const showDrawer = await getByText("Show Drawer");
    const drawerComponent = await findByTestId(drawerWithOnlyMandatoryElements.dataTestId);
    fireEvent.click(showDrawer);
    expect(drawerComponent).toBeInTheDocument();
    const closeIcon = await findByTestId(`${drawerWithOnlyMandatoryElements.dataTestId}-button`);
    fireEvent.click(closeIcon);
    expect(mockCallback).toHaveBeenCalled();
    expect(drawerComponent.hidden).toBe(false);
    // Clean up the spy
    closeSpy.mockRestore();
  });
});
