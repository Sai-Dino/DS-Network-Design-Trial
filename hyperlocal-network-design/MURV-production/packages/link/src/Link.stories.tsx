import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "./Link";
import { Para } from "./styles";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Link",
  component: Link,
  tags: ["autodocs"],
  argTypes: {
    onClick: {
      action: "button clicked",
    },
    linkType: {
      control: {
        type: "select",
      },
      options: ["internal", "external", "standalone", "router"], // This will display a select dropdown to change the 'underline' prop.
    },
    isDisabled: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const InternalLink: Story = {
  args: {
    url: "https://www.google.com/",
    body: "Internal link",
    linkType: "internal",
    isDisabled: false,
  },
};

export const InternalLinkWithCaption: Story = {
  args: {
    url: "https://www.google.com/",
    caption: "Internal link",
    linkType: "internal",
    isDisabled: false,
  },
};

export const ExternalLink: Story = {
  args: {
    url: "https://www.google.com/",
    body: "External link",
    linkType: "external",
  },
};

export const StandaloneLink: Story = {
  args: {
    url: "https://www.google.com/",
    linkType: "standalone",
    body: "Standalone link",
  },
};

export const DisabledLink: Story = {
  args: {
    url: "https://www.google.com/",
    linkType: "standalone",
    body: "Disabled link",
    isDisabled: true,
  },
};

export const ExampleLink = {
  render: (args: any) => (
    <Para>
      Hi this is Link comp
      <Link {...args} url="https://www.google.com/" body="Internal Link" linkType="internal" />.
    </Para>
  ),
};

export const LinkWithClickAndHoverFunctions: Story = {
  args: {
    url: "https://www.google.com/",
    linkType: "external",
    body: "Click and hover on me and open console to see result",
    onHover: () => {
      console.log("Link hovered");
    },
    onClick: () => {
      console.log("Link clicked");
    },
  },
};

export const LinkWithCustomStyles: Story = {
  args: {
    url: "https://www.google.com/",
    body: "Internal link",
    linkType: "internal",
    isDisabled: false,
    styles: {
      width: "200px",
      color: "purple",
    },
  },
};
