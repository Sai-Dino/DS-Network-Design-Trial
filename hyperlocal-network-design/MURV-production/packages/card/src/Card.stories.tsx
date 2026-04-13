import type { Meta, StoryObj } from "@storybook/react";
import Card from "./components/Card";
import { ICardComponent } from "./types";
import {
  MetricCardStory,
  MetricCardWithoutHeaderStory,
  MetricCardWithInvalidElements,
  MultiMetricCardStory,
  ImageCardWithTextStory,
  IconCardWithTextStory,
  ImageCardListWithTextStory,
  ImageCardListWithTextStoryTwoColumns,
  LinkCardWithIconStory,
  ImageCardListWithTextRightAlignedStory,
  IconCardListWithTextStory,
  VerticalImageTextStory,
  NonInteractableCard,
  DisabledCard,
  MetricCardWithTooltip,
  NonInteractableCardWithNoMenuElementRender,
} from "./stories";

const meta: Meta<ICardComponent> = {
  title: "Components/Card",
  component: Card,
  args: {
    id: "murv-card",
    testId: "murv-card",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
  tags: ["autodocs"],
} satisfies Meta<ICardComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleMetricCard: Story = {
  render: MetricCardStory,
  args: {
    id: "murv-card-default",
    testId: "murv-card-default",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const MultipleMetricCard: Story = {
  render: MultiMetricCardStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const MetricCardWithoutHeader: Story = {
  render: MetricCardWithoutHeaderStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};
export const ImageWithTextCard: Story = {
  render: ImageCardWithTextStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};
export const IconWithTextCard: Story = {
  render: IconCardWithTextStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const ImageWithTextList: Story = {
  render: ImageCardListWithTextStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const ImageWithTextListInTwoColumns: Story = {
  render: ImageCardListWithTextStoryTwoColumns,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const NonInteractableCardWithNoMenuElement: Story = {
  render: NonInteractableCardWithNoMenuElementRender,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const ImageWithTextListRightAligned: Story = {
  render: ImageCardListWithTextRightAlignedStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const LinkWithIconList: Story = {
  render: LinkCardWithIconStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const IconWithTextList: Story = {
  render: IconCardListWithTextStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const VerticalImageText: Story = {
  render: VerticalImageTextStory,
  args: {
    id: "1",
    testId: "card-1",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const NonInteractable: Story = {
  render: NonInteractableCard,
  args: {
    id: "1",
    testId: "card-1",
    interactable: false,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const Disabled: Story = {
  render: DisabledCard,
  args: {
    id: "1",
    testId: "card-1",
    interactable: false,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const InvalidElements: Story = {
  render: MetricCardWithInvalidElements,
  args: {
    id: "1",
    testId: "card-1",
    interactable: false,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};

export const SingleMetricCardWithCustomCTAAndTooltip: Story = {
  render: MetricCardWithTooltip,
  args: {
    id: "murv-card-icon-and-tooltip",
    testId: "murv-card-icon-and-tooltip",
    interactable: true,
    disabled: false,
    onClick: (id) => {
      console.log(`Card ${id} clicked!`);
    },
  },
};
