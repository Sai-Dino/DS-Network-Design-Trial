import React from "react";
import { render, fireEvent, waitFor } from "test-utils";
import { DashboardCarousel } from "../src/index";

export const CardsWithImage = Array.from({ length: 6 }, (_, index) => (
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

export const Cards = Array.from({ length: 9 }, (_, index) => (
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

describe("Dashboard Carousel component testing", () => {
  it("Dashboard Carousel component should render with images", () => {
    const { getByTestId } = render(
      <DashboardCarousel
        width="100%"
        autoPlay
        autoPlayDuration={3000}
        cardWidth={340}
        cardHeight={240}
        testId="dashboard-carousel-container"
        headerText="Dashboard Carousel with Images"
      >
        {CardsWithImage}
      </DashboardCarousel>,
    );
    const dashboardCarouselContainer = getByTestId("dashboard-carousel-container");
    expect(dashboardCarouselContainer).toBeInTheDocument();
  });
  it("Dashboard Carousel component navigation should work", () => {
    const mockLeftNavCallback = jest.fn();
    const mockRightNavCallback = jest.fn();
    const { getByTestId } = render(
      <DashboardCarousel
        width="100%"
        autoPlay={false}
        cardWidth={340}
        cardHeight={240}
        testId="dashboard-carousel-container"
        leftNavCallBack={mockLeftNavCallback}
        rightNavCallBack={mockRightNavCallback}
        headerText="Dashboard Carousel Component"
      >
        <div
          style={{
            width: "340px",
            height: "240px",
          }}
        >
          <img
            alt="img1"
            src="https://rukminim1.flixcart.com/flap/3376/560/image/d7f6cf79e749a18b.jpg?q=50"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
        <div
          style={{
            width: "340px",
            height: "240px",
          }}
        >
          <img
            alt="img1"
            src="https://rukminim1.flixcart.com/flap/3376/560/image/d7f6cf79e749a18b.jpg?q=50"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </DashboardCarousel>,
    );
    const leftNav = getByTestId("carousel-left-nav");
    const rightNav = getByTestId("carousel-right-nav");
    fireEvent.click(leftNav);
    waitFor(() => {
      expect(mockLeftNavCallback).toHaveBeenCalledTimes(1);
    });
    fireEvent.click(rightNav);
    waitFor(() => {
      expect(mockRightNavCallback).toHaveBeenCalledTimes(1);
    });
  });
  it("Dashboard Carousel component autoplay should work", () => {
    const { getByText } = render(
      <DashboardCarousel
        width="100%"
        autoPlay
        autoPlayDuration={1000}
        cardWidth={340}
        cardHeight={240}
        testId="dashboard-carousel-container"
        headerText="Dashboard Carousel Component"
      >
        {CardsWithImage}
      </DashboardCarousel>,
    );
    waitFor(() => {
      const dashboardCarousel = getByText("2 / 2");
      expect(dashboardCarousel).toBeInTheDocument();
    });
  });
  it("DashboardCarousel component autoplay should stop on mouseenter and resume on mouseleave", () => {
    const { getByTestId, getByText } = render(
      <DashboardCarousel
        width="100%"
        autoPlay
        autoPlayDuration={5000}
        cardWidth={340}
        cardHeight={240}
        testId="dashboard-carousel-container"
        headerText="Dashboard Carousel Component"
      >
        {CardsWithImage}
      </DashboardCarousel>,
    );
    const ele = getByTestId("dashboard-carousel-container");

    fireEvent.mouseEnter(ele);
    waitFor(() => {
      const dashboardCarousel = getByText("2 / 2");
      expect(dashboardCarousel).toBeInTheDocument();
    });
    fireEvent.mouseLeave(ele);
    waitFor(() => {
      const dashboardCarousel = getByText("1 / 2");
      expect(dashboardCarousel).toBeInTheDocument();
    });
  });
});
