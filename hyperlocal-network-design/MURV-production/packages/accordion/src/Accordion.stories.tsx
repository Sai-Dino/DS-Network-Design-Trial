import React from "react";
import type { StoryObj } from "@storybook/react";
import { Save } from "@murv/icons";
import { Accordion, AccordionGroup } from "./index";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Accordion",
  tags: ["autodocs"],
  render: (args) => {
    const {
      badgeProps,
      icon,
      tagProps,
      disabled,
      primaryTitle,
      secondaryTitle,
      tertiaryTitle,
      dataTestId,
      id,
      content,
      type,
      gap,
      exclusive,
      defaultOpen,
    } = args;

    return type === "accordionGroup" ? (
      <AccordionGroup gap={gap} exclusive={exclusive} dataTestId={dataTestId}>
        <Accordion dataTestId={dataTestId} defaultOpen={defaultOpen}>
          <Accordion.Header
            disabled={disabled}
            badgeProps={badgeProps}
            tagProps={tagProps}
            icon={icon}
            primaryTitle={primaryTitle}
            secondaryTitle={secondaryTitle}
            tertiaryTitle={tertiaryTitle}
            dataTestId={dataTestId}
            id={id}
          />
          <Accordion.Body>{content}</Accordion.Body>
        </Accordion>
        <Accordion defaultOpen={defaultOpen}>
          <Accordion.Header
            disabled={disabled}
            badgeProps={badgeProps}
            tagProps={tagProps}
            icon={icon}
            primaryTitle={primaryTitle}
            secondaryTitle={secondaryTitle}
            tertiaryTitle={tertiaryTitle}
            dataTestId={dataTestId}
            id={id}
          />
          <Accordion.Body>{content}</Accordion.Body>
        </Accordion>
      </AccordionGroup>
    ) : (
      <Accordion dataTestId={dataTestId} defaultOpen={defaultOpen}>
        <Accordion.Header
          disabled={disabled}
          badgeProps={badgeProps}
          tagProps={tagProps}
          icon={icon}
          primaryTitle={primaryTitle}
          secondaryTitle={secondaryTitle}
          tertiaryTitle={tertiaryTitle}
          dataTestId={dataTestId}
          id={id}
        />
        <Accordion.Body>{content}</Accordion.Body>
      </Accordion>
    );
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const DefaultAccordionStory: Story = {
  args: {
    dataTestId: "default-test",
    id: "default-test",
    badgeProps: {
      content: "2",
    },
    tagProps: {
      tagText: "New",
    },
    disabled: false,
    icon: <Save />,
    primaryTitle: "Primary Title",
    secondaryTitle: "Secondary Title",
    tertiaryTitle: "Tertiary Title",
    content: <div>Test Content</div>,
  },
};

export const OpenByDefault: Story = {
  args: {
    ...DefaultAccordionStory.args, // Inherit from the default args
    defaultOpen: true, // Override defaultOpen to true
    dataTestId: "open-by-default",
    id: "open-by-default",
  },
};

export const WithSecondaryTitle: Story = {
  args: {
    dataTestId: "secondary-title",
    id: "dummy-id",
    disabled: false,
    primaryTitle: "Primary Accordion Title",
    secondaryTitle: "Secondary Accordion Title",
    content: <div>Test Content</div>,
  },
};

export const WithTertiaryTitle: Story = {
  args: {
    dataTestId: "tertiary-title",
    id: "dummy-id",
    disabled: false,
    primaryTitle: "Primary Accordion Title",
    tertiaryTitle: "Tertiary Accordion Title",
    content: <div>Test Content</div>,
  },
};

export const WithLongText: Story = {
  args: {
    dataTestId: "long-text",
    id: "dummy-id",
    disabled: false,
    primaryTitle: "Long Primary Accordion Title",
    secondaryTitle: "Long Secondary Accordion Title",
    tertiaryTitle: "Long Tertiary Accordion Title",
    content: <div>Test Content</div>,
  },
};

export const DisabledAccordion: Story = {
  args: {
    dataTestId: "disabled-accordion",
    id: "dummy-id",
    badgeProps: {
      content: "2",
    },
    tagProps: {
      tagText: "New",
    },
    disabled: true,
    primaryTitle: "Primary Title",
    secondaryTitle: "Secondary Title",
    tertiaryTitle: "Tertiary Title",
    content: <div>Test Content</div>,
  },
};

export const WithBadge: Story = {
  args: {
    dataTestId: "with-badge",
    id: "dummy-id",
    badgeProps: {
      content: "2",
    },
    disabled: false,
    primaryTitle: "Primary Accordion Title",
    content: <div>Test Content</div>,
  },
};

export const WithIcon: Story = {
  args: {
    dataTestId: "with-icon",
    id: "dummy-id",
    badgeProps: {
      content: "2",
    },
    tagProps: {
      tagText: "New",
    },
    disabled: false,
    icon: <Save />,
    primaryTitle: "Primary Accordion Title",
    secondaryTitle: "Secondary Accordion Title",
    tertiaryTitle: "Tertiary Accordion Title",
    content: <div>Test Content</div>,
  },
};

export const WithExclusiveGroup: Story = {
  args: {
    dataTestId: "exclu-group",
    id: "dummy-id",
    badgeProps: {
      content: "2",
    },
    tagProps: {
      tagText: "New",
    },
    primaryTitle: "Primary Title",
    secondaryTitle: "Secondary Title",
    tertiaryTitle: "Tertiary Title",
    content: <div>Test Content</div>,
    type: "accordionGroup",
    gap: "5px",
    exclusive: true,
  },
};

export const WithoutExclusiveGroup: Story = {
  args: {
    dataTestId: "without-exclu-group",
    id: "dummy-id",
    badgeProps: {
      content: "2",
    },
    tagProps: {
      tagText: "New",
    },
    primaryTitle: "Primary Title",
    secondaryTitle: "Secondary Title",
    tertiaryTitle: "Tertiary Title",
    content: <div>Test Content</div>,
    type: "accordionGroup",
    gap: "5px",
    exclusive: false,
  },
};
