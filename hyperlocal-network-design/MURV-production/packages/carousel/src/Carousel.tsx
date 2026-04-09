import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "@murv/icons";
import { CarouselProps } from "./types";
import {
  CarouselContainer,
  ContentWindow,
  Content,
  ButtonContainer,
  CustomButton,
  SlideCounterContainer,
  CardImageContainer,
  CardBodyContainer,
} from "./styles";

/**
 * A carousel component is a user interface element that displays a rotating set of images or content items in a cyclic manner. It's commonly used on websites to showcase a collection of images, products, or other content in an interactive and visually appealing way.
 */

interface CarouselStateProps {
  currentSlide: number;
  autoplayId: string | number;
}
const Carousel: React.FC<CarouselProps> = ({
  cardWidth = 340,
  cardHeight = 240,
  children,
  itemSpacing = 8,
  width = "100%",
  autoPlay = false,
  autoPlayDuration = 3000,
  leftNavCallBack = () => { },
  rightNavCallBack = () => { },
  testId = "carousel-container",
}) => {
  const [caraouselState, setCaraouselState] = useState<CarouselStateProps>({
    currentSlide: 0,
    autoplayId: "",
  });
  const parentContainerRef = useRef<HTMLDivElement | null>(null);

  const onLeftClick = () => {
    setCaraouselState((prevCaraouselState: CarouselStateProps) => {
      const currentSlide =
        (prevCaraouselState.currentSlide - 1 + children.length) % children.length;
      leftNavCallBack(currentSlide);
      return {
        ...prevCaraouselState,
        currentSlide,
      };
    });
  };
  const onRightClick = () => {
    setCaraouselState((prevCaraouselState: CarouselStateProps) => {
      const currentSlide = (prevCaraouselState.currentSlide + 1) % children.length;
      rightNavCallBack(currentSlide);
      return {
        ...prevCaraouselState,
        currentSlide: (prevCaraouselState.currentSlide + 1) % children.length,
      };
    });
  };
  const autoScroll = () => {
    setCaraouselState((prevCaraouselState: CarouselStateProps) => ({
      ...prevCaraouselState,
      currentSlide: (prevCaraouselState.currentSlide + 1) % children.length,
    }));
  };

  const startAutoplay = () => {
    const intervalId = setInterval(autoScroll, autoPlayDuration);
    setCaraouselState((prevCaraouselState: CarouselStateProps) => ({
      ...prevCaraouselState,
      autoplayId: intervalId,
    }));
  };
  const stopAutoplay = () => {
    clearInterval(caraouselState.autoplayId);
    setCaraouselState((prevCaraouselState: CarouselStateProps) => ({
      ...prevCaraouselState,
      autoplayId: "",
    }));
  };
  const handleMouseEnter = () => {
    if (autoPlay) {
      stopAutoplay();
    }
  };
  const handleMouseLeave = () => {
    if (autoPlay) {
      startAutoplay();
    }
  };
  useEffect(() => {
    if (autoPlay) {
      startAutoplay();
    } else if (caraouselState.autoplayId !== "") {
      stopAutoplay();
    }
  }, [autoPlay]);
  useEffect(() => {
    if (parentContainerRef.current) {
      parentContainerRef.current.style.transform = `translateX(-${
        caraouselState.currentSlide * (cardWidth + itemSpacing * 2)
      }px)`;
    }
  }, [children.length, caraouselState.currentSlide]);
  /* eslint-disable arrow-body-style */
  useEffect(() => {
    return () => {
      if (caraouselState.autoplayId !== "") {
        // Clearing interval before unmount
        clearInterval(caraouselState.autoplayId);
      }
    };
  }, []);
  return (
    <CarouselContainer
      width={width}
      role="region"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={testId}
    >
      <ButtonContainer>
        <CustomButton
          onClick={onLeftClick}
          aria-label="Previous Slide"
          data-testid="carousel-left-nav"
        >
          <ChevronLeft className="chevron-icon"/>
        </CustomButton>
        <SlideCounterContainer>
          {caraouselState.currentSlide + 1} / {children.length}
        </SlideCounterContainer>
        <CustomButton
          onClick={onRightClick}
          aria-label="Next Slide"
          data-testid="carousel-right-nav"
        >
          <ChevronRight className="chevron-icon" />
        </CustomButton>
      </ButtonContainer>
      <ContentWindow ref={parentContainerRef} role="listbox" tabIndex={0} aria-live="polite">
        {/* eslint-disable react/no-array-index-key */}
        {children.map((visibleItem, index) => (
          <Content
            role="option"
            spacing={itemSpacing}
            width={cardWidth}
            height={cardHeight}
            key={`carousel-item-${index}`}
          >
            {visibleItem}
          </Content>
        ))}
      </ContentWindow>
    </CarouselContainer>
  );
};

export const CardsWithImage = Array.from({ length: 6 }, (_, index) => (
  <CardImageContainer key={index + 1}>
    <img
      alt={`img${index + 1}`}
      src={`https://rukminim1.flixcart.com/flap/3376/560/image/${
        (index + 1) % 2 === 0 ? "b00d178b8f74139f" : "d7f6cf79e749a18b"
      }.jpg?q=50`}
    />
  </CardImageContainer>
));
export const Cards = Array.from({ length: 9 }, (_, index) => (
  <CardBodyContainer key={index + 1}>
    <p>Sample heading of card</p>
    <p>Sample sub heading of card</p>
  </CardBodyContainer>
));

export default Carousel;
