import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PageInfo, Notifications, Help, Apps, Menu } from "@murv/icons";
import { MobilePageHeader, MobilePageHeaderProps } from "./src";

const FK_LOGO =
  "https://static-assets-web.flixcart.com/fk-p-fk-sellerhub/images/fk_vendor_hub_logo1711008672.png";

const mockOnSearch = (query: String) => {
  alert(`Pass onSearch function to search for query - ${query}`); // eslint-disable-line no-alert
};

const breakpoints = {
  mobile: "480px",
};

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Mobile Page Header",
  component: MobilePageHeader,
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
          height: "150px",
          background: "whitesmoke",
        }}
      >
        <div style={{ width: breakpoints.mobile }}>
          <Story />
        </div>
      </div>
    ),
  ],
} satisfies Meta<MobilePageHeaderProps>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const MobilePageHeaderWithSearchAndBack: Story = {
  args: {
    id: "mobile-page-header",
    dataTestId: "mobile-page-header-testid",
    backButtonProps: {
      onClick: () => {},
    },
    brandLogoURL: FK_LOGO,
    onBrandLogoClick: () => alert("Brand Logo clicked"), // eslint-disable-line no-alert
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
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

export const MobilePageHeaderWithSearch: Story = {
  args: {
    brandLogoURL: FK_LOGO,
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
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

export const MobilePageHeaderWithoutLogoWithPageTitle: Story = {
  args: {
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndBack: Story = {
  args: {
    backButtonProps: {
      onClick: () => {},
      buttonType: "tertiary",
    },
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndSearch: Story = {
  args: {
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    searchProps: {
      id: "mobile-page-header-search",
      placeholder: "Search by brand",
      onSearch: (query) => mockOnSearch(query),
    },
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndBackAndSearch: Story = {
  args: {
    backButtonProps: {
      onClick: () => {},
      buttonType: "tertiary",
    },
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    searchProps: {
      id: "mobile-page-header-search",
      placeholder: "Search by brand",
      onSearch: (query) => mockOnSearch(query),
    },
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndSubTitle: Story = {
  args: {
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    pageSubTitle: "this is the listings page",
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndSubTitleAndSearch: Story = {
  args: {
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    pageSubTitle: "this is the listings page",
    searchProps: {
      id: "mobile-page-header-search",
      placeholder: "Search by brand",
      onSearch: (query) => mockOnSearch(query),
    },
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndSubTitleAndBack: Story = {
  args: {
    backButtonProps: {
      onClick: () => {},
      buttonType: "tertiary",
    },
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    pageSubTitle: "this is the listings page",
  },
  parameters: {},
};

export const MobilePageHeaderWithoutLogoWithPageTitleAndSubTitleAndBackAndSearch: Story = {
  args: {
    backButtonProps: {
      onClick: () => {},
      buttonType: "tertiary",
    },
    buttonGroupProps: {
      buttons: [
        {
          buttonType: "tertiary",
          size: "small",
          children: <PageInfo color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Notifications color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Help color="black" />,
          onClick: () => {},
        },
        {
          buttonType: "tertiary",
          size: "small",
          children: <Apps color="black" />,
          onClick: () => {},
        },
      ],
    },
    pageTitle: "Listings page",
    pageSubTitle: "this is the listings page",
    searchProps: {
      id: "mobile-page-header-search",
      placeholder: "Search by brand",
      onSearch: (query) => mockOnSearch(query),
    },
  },
  parameters: {},
};

export const MobilePageHeaderWithToggle: Story = {
  args: {
    id: "mobile-page-header",
    dataTestId: "mobile-page-header-testid",
    backButtonProps: {
      children: <Menu color="black" />,
    },
    brandLogoURL: FK_LOGO,
    toggleProps: { label: "Toggle", id: "header-toggle" },
  },
  parameters: {},
};
