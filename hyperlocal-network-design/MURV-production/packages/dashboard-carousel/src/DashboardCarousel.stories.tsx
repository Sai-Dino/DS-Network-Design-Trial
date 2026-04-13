import React, { useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Add } from "@murv/icons";
import { DashboardCarousel } from "./index";

const CardsWithImage = Array.from({ length: 6 }, (_, index) => (
  <div
    key={index + 1}
    style={{
      width: "340px",
      height: "240px",
    }}
  >
    <img
      alt={`img${index + 1}`}
      src={`https://rukminim1.flixcart.com/flap/3376/560/image/${
        (index + 1) % 2 === 0 ? "b00d178b8f74139f" : "d7f6cf79e749a18b"
      }.jpg?q=50`}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  </div>
));
const Cards = Array.from({ length: 9 }, (_, index) => (
  <div
    key={index + 1}
    style={{
      width: "340px",
      height: "240px",
      borderRadius: "10px",
      backgroundColor: "#8adea3",
      border: "2px",
    }}
  >
    <p>Sample heading of card</p>
    <p>Sample sub heading of card</p>
  </div>
));

// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction
const meta = {
  title: "Components/DashboardCarousel",
  component: DashboardCarousel,
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
} satisfies Meta<typeof DashboardCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
export const DashboardCarouselWithImage: Story = {
  args: {
    width: "100%",
    autoPlay: false,
    cardWidth: 340,
    cardHeight: 240,
    children: CardsWithImage,
    testId: "dashboard-carousel-container",
    leftNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    rightNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    headerText: "This is dashboard Carousel",
    headerIcon: <Add />,
  },
};

export const DashboardCarouselWithCard: Story = {
  args: {
    width: "100%",
    autoPlay: false,
    cardWidth: 340,
    cardHeight: 240,
    children: Cards,
    testId: "dashboard-carousel-container",
    leftNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    rightNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    headerText: "Alerts & Notifications",
    headerIcon: (
      <img
        alt="img1"
        src="https://img1a.flixcart.com/fk-sp-static/images/homeStockWidgetIcon.svg"
      />
    ),
    backgroundColor: "#F5F5F5",
  },
};

export const DynamicCarousel: Story = {
  render: (args) => {
    const [carouselChildren, setCarouselChildren] = useState(args.children);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCarouselChildren((prevChildren) => [
          ...prevChildren.slice(0, 2),
          null,
          ...prevChildren.slice(4),
        ]);
      }, 3000); // Change to null after 3 seconds

      return () => clearTimeout(timer);
    }, []);

    return <DashboardCarousel {...args}>{carouselChildren} </DashboardCarousel>;
  },
  args: {
    width: "100%",
    autoPlay: false,
    cardWidth: 340,
    cardHeight: 240,
    children: Cards,
    testId: "dashboard-carousel-container",
    leftNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    rightNavCallBack: (slideNumber: number) => {
      console.log(slideNumber);
    },
    headerText: "Dynamic Carousel",
    backgroundColor: "#FFFAFA",
  },
};
