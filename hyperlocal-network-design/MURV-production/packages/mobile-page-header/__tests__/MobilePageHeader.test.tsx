import React from "react";
import "@testing-library/jest-dom";
import { ButtonGroupProps } from "@murv/button-group";
import { ISearchProps } from "@murv/search";
import { ButtonProps } from "@murv/button";
import { PageInfo, Notifications, Help, Apps } from "@murv/icons";
import { render } from "test-utils";
import { MobilePageHeader } from "../src";

const FK_LOGO =
  "https://static-assets-web.flixcart.com/fk-p-fk-sellerhub/images/fk_vendor_hub_logo1711008672.png";

describe("MobilePageHeader Component testing", () => {
  const mockButtonProps: ButtonProps = {
    onClick: jest.fn(),
  };
  const mockSearchProps: ISearchProps = {
    id: "mobile-page-header-search",
    placeholder: "Search by brand",
    onSearch: jest.fn(),
  };
  const mockButtonGroupProps: ButtonGroupProps = {
    buttons: [
      {
        buttonType: "tertiary",
        size: "small",
        children: <PageInfo color="black" />,
        onClick: jest.fn(),
      },
      {
        buttonType: "tertiary",
        size: "small",
        children: <Notifications color="black" />,
        onClick: jest.fn(),
      },
      {
        buttonType: "tertiary",
        size: "small",
        children: <Help color="black" />,
        onClick: jest.fn(),
      },
      {
        buttonType: "tertiary",
        size: "small",
        children: <Apps color="black" />,
        onClick: jest.fn(),
      },
    ],
  };
  it("Mobile Page Header with logo and all props", () => {
    const { container } = render(
      <MobilePageHeader
        id="mobile-page-header"
        dataTestId="mobile-page-header-testid"
        brandLogoURL={FK_LOGO}
        onBrandLogoClick={() => jest.fn()}
        backButtonProps={mockButtonProps}
        searchProps={mockSearchProps}
        buttonGroupProps={mockButtonGroupProps}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it("Mobile Page Header with page title and all props", () => {
    const { container } = render(
      <MobilePageHeader
        id="mobile-page-header"
        dataTestId="mobile-page-header-testid"
        pageTitle="Flipkart"
        pageSubTitle="Seller Hub"
        onBrandLogoClick={() => jest.fn()}
        backButtonProps={mockButtonProps}
        searchProps={mockSearchProps}
        buttonGroupProps={mockButtonGroupProps}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
