import type { Meta, StoryObj } from "@storybook/react";
import { Add } from "@murv/icons";
import { Banner } from "./Banner";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Banner",
  component: Banner as React.ComponentType,
  tags: ["autodocs"],
} as Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const buttonGroupProps = {
  buttons: [
    {
      buttonType: "inline",
      buttonStyle: "brand",
      PrefixIcon: Add,
      onClick: () => console.log("secondary"),
    },
    {
      buttonType: "inline",
      buttonStyle: "brand",
      children: "Button",
      onClick: () => console.log("primary"),
    },
  ],
  alignment: "right",
  padding: "0px",
};
// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const SuccessBanner: Story = {
  args: {
    id: "banner1",
    dataTestId: "banner-storybook-ui-container",
    status: "success",
    primaryText: "Ronald Richards",
    secondaryText: "Secondary Information",
    tertiaryText: "Dec 7, 2019 23:26",
    buttonGroupProps,
  },
};

export const WarningBannerWithoutTertiary: Story = {
  args: {
    id: "banner2",
    dataTestId: "banner-storybook-ui-container",
    status: "warning",
    primaryText: "Ronald Richards",
    secondaryText: "Secondary Information",
    buttonGroupProps,
  },
};
export const ErrorBannerWithoutSecondaryText: Story = {
  args: {
    id: "banner3",
    dataTestId: "banner-storybook-ui-container",
    status: "error",
    primaryText: "Ronald Richards",
    tertiaryText: "Dec 7, 2019 23:26",
    buttonGroupProps,
  },
};
export const InfoBannerWithoutPrimaryText: Story = {
  args: {
    id: "banner4",
    dataTestId: "banner-storybook-ui-container",
    status: "information",
    secondaryText: "Secondary Information",
    tertiaryText: "Dec 7, 2019 23:26",
    buttonGroupProps,
  },
};
export const InfoBannerWithCustomTag: Story = {
  args: {
    id: "banner5",
    dataTestId: "banner-storybook-ui-container",
    status: "information",
    tagProps: {
      tagText: "Custom Tag",
      alignment: "regular",
      tagStyle: "green",
    },
    primaryText: "Ronald Richards",
    secondaryText: "Secondary Information",
    tertiaryText: "Dec 7, 2019 23:26",
    buttonGroupProps,
  },
};
export const WithoutButtonGroupAndCloseButton: Story = {
  args: {
    id: "banner6",
    dataTestId: "banner-storybook-ui-container",
    status: "information",
    primaryText: "Ronald Richards",
    secondaryText: "Secondary Information",
    tertiaryText: "Dec 7, 2019 23:26",
    showCloseIcon: false,
  },
};

export const WithoutStatusTag: Story = {
  args: {
    id: "banner6",
    dataTestId: "banner-storybook-ui-container",
    status: "error",
    showStatusTag: false,
    primaryText: "Ronald Richards",
    secondaryText: "Secondary Information",
    showCloseIcon: false,
    buttonGroupProps,
  },
};
