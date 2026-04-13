import React from "react";
import { render, fireEvent, waitFor } from "test-utils";
import { Carousel } from "../src/index";
import { CardImageContainer } from "../src/styles";
import { CardsWithImage } from "../src/Carousel";

describe("Carousel component testing", () => {
  it("Carousel component should render with images", () => {
    const { container, getByTestId } = render(
      <Carousel
        width="100%"
        autoPlay
        autoPlayDuration={3000}
        cardWidth={340}
        cardHeight={240}
        testId="carousel-container"
      >
        {CardsWithImage}
      </Carousel>,
    );
    const carouselContainer = getByTestId("carousel-container");
    expect(carouselContainer).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });
  it("Carousel component navigation should work", () => {
    const mockLeftNavCallback = jest.fn();
    const mockRightNavCallback = jest.fn();
    const { getByTestId } = render(
      <Carousel
        width="100%"
        autoPlay={false}
        autoPlayDuration={3000}
        cardWidth={340}
        cardHeight={240}
        testId="carousel-container"
        leftNavCallBack={mockLeftNavCallback}
        rightNavCallBack={mockRightNavCallback}
      >
        <CardImageContainer>
          <img
            alt="img1"
            src="https://rukminim1.flixcart.com/flap/3376/560/image/d7f6cf79e749a18b.jpg?q=50"
          />
        </CardImageContainer>
        <CardImageContainer>
          <img
            alt="img1"
            src="https://rukminim1.flixcart.com/flap/3376/560/image/d7f6cf79e749a18b.jpg?q=50"
          />
        </CardImageContainer>
      </Carousel>,
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
  it("Carousel component autoplay should work", () => {
    const { getByText } = render(
      <Carousel
        width="100%"
        autoPlay
        autoPlayDuration={1000}
        cardWidth={340}
        cardHeight={240}
        testId="carousel-container"
      >
        {CardsWithImage}
      </Carousel>,
    );
    waitFor(() => {
      const carousel = getByText("2 / 2");
      expect(carousel).toBeInTheDocument();
    });
  });
  it("Carousel component autoplay should stop on mouseenter and resume on mouseleave", () => {
    const { getByTestId, getByText } = render(
      <Carousel
        width="100%"
        autoPlay
        autoPlayDuration={5000}
        cardWidth={340}
        cardHeight={240}
        testId="carousel-container"
      >
        {CardsWithImage}
      </Carousel>,
    );
    const ele = getByTestId("carousel-container");

    fireEvent.mouseEnter(ele);
    waitFor(() => {
      const carousel = getByText("2 / 2");
      expect(carousel).toBeInTheDocument();
    });
    fireEvent.mouseLeave(ele);
    waitFor(() => {
      const carousel = getByText("1 / 2");
      expect(carousel).toBeInTheDocument();
    });
  });
});
