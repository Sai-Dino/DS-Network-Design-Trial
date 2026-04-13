import React, { useEffect, useState, useRef, useCallback, ReactElement } from "react";
import Tag from "@murv/tag";
import { Pagination } from "./Pagination";
import { DashboardCarouselProps } from "./types";
import {
  CarouselContainer,
  ContentWindow,
  Content,
  CarouselHeader,
  HeaderText,
  ContentContainer,
} from "./styles";

interface CarouselStateProps {
  currentSlide: number;
  autoplayId: NodeJS.Timeout | null;
}

/* eslint-disable react/prop-types */
const CarouselItem: React.FC<{
  visibleItem: React.ReactNode;
  cardWidth: number;
  cardHeight: number;
  id: any;
}> = React.memo(({ visibleItem, cardWidth, cardHeight, id }) => (
  <Content role="option" width={cardWidth} height={cardHeight} data-id={id}>
    {visibleItem}
  </Content>
));
/* eslint-enable react/prop-types */

const DashboardCarousel: React.FC<DashboardCarouselProps> = ({
  paginationPosition = "top-right",
  cardWidth = 340,
  cardHeight = 240,
  children,
  itemSpacing = 8,
  width = "100%",
  autoPlay = false,
  autoPlayDuration = 3000,
  leftNavCallBack = () => {},
  rightNavCallBack = () => {},
  testId = "carousel-container",
  headerIcon = null,
  headerText,
  headerTagProps,
  backgroundColor = "transparent",
}) => {
  const [numOfChildren, setNumOfChildren] = useState(children?.length || 0);
  const [carouselState, setCarouselState] = useState<CarouselStateProps>({
    currentSlide: 0,
    autoplayId: null,
  });

  const parentContainerRef = useRef<HTMLDivElement | null>(null);

  const checkChildrenCount = useCallback(() => {
    if (parentContainerRef.current) {
      const childrenArray = Array.from(parentContainerRef.current?.children) as HTMLElement[];
      childrenArray.forEach((child) => {
        if (child.children?.length === 0) {
          child.remove();
        }
      });
      setNumOfChildren(parentContainerRef.current?.children?.length);
    }
  }, [parentContainerRef]);

  useEffect(() => {
    if (parentContainerRef.current) {
      const observer = new MutationObserver(checkChildrenCount);
      observer.observe(parentContainerRef.current, {
        childList: true,
        subtree: true,
      });
      return () => {
        observer.disconnect();
      };
    }
    return () => {};
  }, [parentContainerRef]);

  const onLeftClick = () => {
    setCarouselState((prevCarouselState: CarouselStateProps) => {
      const currentSlide = (prevCarouselState.currentSlide - 1 + numOfChildren) % numOfChildren;
      leftNavCallBack(currentSlide);
      return {
        ...prevCarouselState,
        currentSlide,
      };
    });
  };
  const onRightClick = () => {
    setCarouselState((prevCarouselState: CarouselStateProps) => {
      const currentSlide = (prevCarouselState.currentSlide + 1) % numOfChildren;
      rightNavCallBack(currentSlide);
      return {
        ...prevCarouselState,
        currentSlide: (prevCarouselState.currentSlide + 1) % numOfChildren,
      };
    });
  };
  const autoScroll = () => {
    setCarouselState((prevCarouselState: CarouselStateProps) => ({
      ...prevCarouselState,
      currentSlide: (prevCarouselState.currentSlide + 1) % numOfChildren,
    }));
  };

  const startAutoplay = () => {
    const intervalId = setInterval(autoScroll, autoPlayDuration);
    setCarouselState((prevCarouselState: CarouselStateProps) => ({
      ...prevCarouselState,
      autoplayId: intervalId,
    }));
  };
  const stopAutoplay = () => {
    if (carouselState.autoplayId !== null) clearInterval(carouselState.autoplayId);
    setCarouselState((prevCarouselState: CarouselStateProps) => ({
      ...prevCarouselState,
      autoplayId: null,
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
    } else if (carouselState.autoplayId !== null) {
      stopAutoplay();
    }
  }, [autoPlay]);
  useEffect(() => {
    if (parentContainerRef.current) {
      parentContainerRef.current.style.transform = `translateX(-${
        carouselState.currentSlide * (cardWidth + itemSpacing)
      }px)`;
    }
  }, [numOfChildren, carouselState.currentSlide]);
  /* eslint-disable arrow-body-style */
  useEffect(() => {
    return () => {
      if (carouselState.autoplayId !== null) {
        // Clearing interval before unmount
        clearInterval(carouselState.autoplayId);
      }
    };
  }, []);

  if (children?.length === 0 || numOfChildren === 0) return null;

  return (
    <CarouselContainer
      width={width}
      role="region"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={testId}
      backgroundColor={backgroundColor}
    >
      <CarouselHeader>
        {headerIcon}
        <HeaderText>{headerText}</HeaderText>
        {headerTagProps ? <Tag {...headerTagProps} /> : null}
        {paginationPosition === "top-right" ? (
          <Pagination
            paginationPosition={paginationPosition}
            onLeftClick={onLeftClick}
            onRightClick={onRightClick}
            currentSlide={carouselState.currentSlide}
            totalSlides={numOfChildren}
          />
        ) : null}
      </CarouselHeader>

      <ContentContainer>
        <ContentWindow
          ref={parentContainerRef}
          role="listbox"
          tabIndex={0}
          aria-live="polite"
          spacing={itemSpacing}
        >
          {React.Children.map(children, (child) => {
            return (
              <CarouselItem
                key={(child as ReactElement).props["data-id"]}
                visibleItem={child}
                cardWidth={cardWidth}
                cardHeight={cardHeight}
                id={(child as ReactElement).props["data-id"]}
              />
            );
          })}
        </ContentWindow>
      </ContentContainer>
      {paginationPosition !== "top-right" ? (
        <Pagination
          paginationPosition={paginationPosition}
          onLeftClick={onLeftClick}
          onRightClick={onRightClick}
          currentSlide={carouselState.currentSlide}
          totalSlides={numOfChildren}
        />
      ) : null}
    </CarouselContainer>
  );
};

export default DashboardCarousel;
