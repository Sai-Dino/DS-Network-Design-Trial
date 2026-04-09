import type { Meta, StoryObj } from "@storybook/react";
import { Carousel } from "./index";
import { CardsWithImage, Cards } from "./Carousel";

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/Carousel",
  component: Carousel,
  tags: ["autodocs"],
  argTypes: {
    width: { control: "string" },
    autoPlay: { control: "boolean" },
    autoPlayDuration: { control: "number" },
    cardWidth: { control: "number" },
    children: { control: "string" },
    testId: { control: "string" },
    leftNavCallBack: { control: "action" },
    rightNavCallBack: { control: "action" },
  },
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const CarouselWithImage: Story = {
  args: {
    width: "100%",
    autoPlay: true,
    autoPlayDuration: 3000,
    cardWidth: 340,
    cardHeight: 240,
    children: CardsWithImage,
    testId: "carousel-container",
    leftNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    rightNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
  },
};

export const CarouselWithCard: Story = {
  args: {
    width: "100%",
    autoPlay: true,
    autoPlayDuration: 3000,
    cardWidth: 340,
    cardHeight: 240,
    children: Cards,
    testId: "carousel-container",
    leftNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    rightNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
  },
};
