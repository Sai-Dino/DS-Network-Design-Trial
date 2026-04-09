import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Notifications, Help, Apps, ChevronRight } from "@murv/icons";
import { ProductHeader, ProductHeaderProps } from "./src";

const FK_LOGO =
  "https://static-assets-web.flixcart.com/fk-p-fk-sellerhub/images/fk_logo_brand_portal1713504677.png";

const mockOnSearch = (query: String) => {
  alert(`Pass onSearch function to search for query - ${query}`); // eslint-disable-line no-alert
};

const suffixOptions = {
  none: undefined,
  shortcut: () => <span>Shortcut /</span>,
  hello: () => <span>Hello /</span>,
  button: () => <button type="button">Action</button>,
};

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Product Header",
  component: ProductHeader,
  tags: ["autodocs"],
  argTypes: {},
  decorators: [
    (Story) => (
      <div
        style={{
          zoom: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "250px",
          background: "white",
          padding: "8px",
        }}
        data-testid="product-header-storybook-ui-container"
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<ProductHeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const ProductHeaderWithSearch: Story = {
  args: {
    contentWidth: "100%",
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    searchProps: {
      id: "mobile-page-header-search",
      placeholder: "Search by brand",
      onSearch: (query) => mockOnSearch(query),
    },
  },
  parameters: {},
};
export const ProductHeaderWithSearchPrefixAndSuffixControls: Story = {
  args: {
    contentWidth: "100%",
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    searchProps: {
      id: "page-header-search-prefix-suffix",
      placeholder: "Search by brand",
      prefixIcon: true,
      onSearch: (query: string) => mockOnSearch(query),
    },
    suffixVariant: "shortcut",
  } as any,
  argTypes: {
    suffixVariant: {
      options: Object.keys(suffixOptions),
      control: { type: "select" },
    },
  },
  render: (args: any) => {
    const { suffixVariant, ...rest } = args;
    const suffixFn = suffixOptions[suffixVariant as keyof typeof suffixOptions];
    const searchProps = {
      ...(rest.searchProps || {}),
      renderSuffix: suffixFn,
    };
    return <ProductHeader {...(rest as any)} searchProps={searchProps} />;
  },
};
export const ProductHeaderWithoutSearch: Story = {
  args: {
    contentWidth: "100%",
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
  },
  parameters: {},
};

export const ProductHeaderUsedInFlipkartBrands: Story = {
  args: {
    contentWidth: "100%",
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          buttonStyle: "brand",
          PrefixIcon: () => <>Login</>,
          onClick: () => {},
        },
        {
          buttonType: "ascent",
          PrefixIcon: () => (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              Enroll Now <ChevronRight />
            </div>
          ),
          onClick: () => {},
        },
      ],
      spacing: "10px", // theme.murv.spacing.m
      padding: "0",
    },
  },
  parameters: {},
};

export const ProductHeaderWithProfileSection: Story = {
  args: {
    contentWidth: "100%",
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          PrefixIcon: () => <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    profileImage: (
      <img
        src="https://www.spongebobshop.com/cdn/shop/products/SB-Standees-Spong-3_1200x.jpg?v=1603744568"
        alt="Profile"
      />
    ),
    profileDropdown: {
      options: [{ label: "View Profile", value: "View Profile" }],
      cb: (val: string) => console.log("Selected value is ", val),
      name: "Vivek P",
    },
  },
  parameters: {},
};

ProductHeaderUsedInFlipkartBrands.storyName = "Example : Being used in brand.flipkart.com";
