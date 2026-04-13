import React from "react";
import "@testing-library/jest-dom";
import { ButtonGroupProps } from "@murv/button-group";
import { ISearchProps } from "@murv/search";
import { Notifications, Help, Apps } from "@murv/icons";
import { render, screen, fireEvent } from "test-utils";
import { ProductHeader } from "../src";

const FK_LOGO =
  "https://static-assets-web.flixcart.com/fk-p-fk-sellerhub/images/fk_vendor_hub_logo1711008672.png";

describe("ProductHeader Component testing", () => {
  const mockSearchProps: ISearchProps = {
    id: "product-header-search",
    placeholder: "Search by brand",
    onSearch: jest.fn(),
  };
  const mockButtonGroupProps: ButtonGroupProps = {
    buttons: [
      {
        buttonType: "tertiary",
        size: "small",
        children: (<Notifications color="black" />) as unknown as React.ReactText,
        onClick: jest.fn(),
      },
      {
        buttonType: "tertiary",
        size: "small",
        children: (<Help color="black" />) as unknown as React.ReactText,
        onClick: jest.fn(),
      },
      {
        buttonType: "tertiary",
        size: "small",
        children: (<Apps color="black" />) as unknown as React.ReactText,
        onClick: jest.fn(),
      },
    ],
  };

  it("Product Header without search", () => {
    const { container } = render(
      <ProductHeader
        id="product-header"
        dataTestId="product-header-testid"
        brandLogoURL={FK_LOGO}
        onBrandLogoClick={() => jest.fn()}
        buttonGroupProps={mockButtonGroupProps}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it("Product Header with search triggers onSearch", () => {
    const onSearchMock = jest.fn();
    const propsWithMock = { ...mockSearchProps, onSearch: onSearchMock };

    render(
      <ProductHeader
        id="product-header"
        dataTestId="product-header-testid"
        brandLogoURL={FK_LOGO}
        onBrandLogoClick={() => jest.fn()}
        searchProps={propsWithMock}
        buttonGroupProps={mockButtonGroupProps}
      />,
    );

    const input = screen.getByPlaceholderText("Search by brand") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "nike" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onSearchMock).toHaveBeenCalledTimes(1);
    expect(onSearchMock).toHaveBeenCalledWith("nike", "product-header-search");
  });
});
